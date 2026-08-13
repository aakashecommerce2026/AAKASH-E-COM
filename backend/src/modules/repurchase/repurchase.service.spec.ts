import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RepurchaseService } from './repurchase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RepurchaseCommissionService } from '../repurchase-commission/repurchase-commission.service';
import { MemberRole, MemberStatus, Prisma } from '@prisma/client';

describe('RepurchaseService Unit Tests & Rules Verification', () => {
  let service: RepurchaseService;
  let prisma: any;
  let auditService: any;
  let repurchaseCommissionService: any;

  const mockActiveMember = {
    id: 'active-member-uuid-1',
    memberCode: 'AK10001',
    name: 'Active Member',
    mobile: '+919999999991',
    status: MemberStatus.ACTIVE,
  };

  const mockInactiveMember = {
    id: 'inactive-member-uuid-2',
    memberCode: 'AK10002',
    name: 'Blocked Member',
    mobile: '+919999999992',
    status: MemberStatus.BLOCKED,
  };

  const mockRepurchaseEntry = {
    id: 'rep-entry-uuid-1',
    transactionRef: 'REP-2026-00001',
    memberId: mockActiveMember.id,
    member: mockActiveMember,
    amount: 1500.5,
    transactionDate: new Date('2026-08-10T10:00:00Z'),
    remarks: 'Monthly repurchase',
    createdBy: 'admin-uuid-1',
    createdAt: new Date('2026-08-10T10:00:00Z'),
    updatedAt: new Date('2026-08-10T10:00:00Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    prisma = {
      repurchaseEntry: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      repurchaseCommissionLedger: {
        count: jest.fn().mockResolvedValue(0), // Default: no commissions generated yet
      },
      member: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    repurchaseCommissionService = {
      calculateForEntry: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepurchaseService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: RepurchaseCommissionService, useValue: repurchaseCommissionService },
      ],
    }).compile();

    service = module.get<RepurchaseService>(RepurchaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. create (POST /admin/repurchase) & DB Uniqueness', () => {
    it('should create repurchase entry, trigger calculateForEntry, and log CREATE_REPURCHASE_ENTRY', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(null);
      prisma.member.findFirst.mockResolvedValue(mockActiveMember);
      prisma.repurchaseEntry.create.mockResolvedValue(mockRepurchaseEntry);

      const result = await service.create(
        {
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 1500.5,
          remarks: 'Monthly repurchase',
        },
        'admin-uuid-1',
        MemberRole.ADMIN,
      );

      expect(result.id).toEqual(mockRepurchaseEntry.id);
      expect(repurchaseCommissionService.calculateForEntry).toHaveBeenCalledWith(
        mockRepurchaseEntry.id,
        expect.anything(),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'CREATE_REPURCHASE_ENTRY',
          actorId: 'admin-uuid-1',
          actorRole: MemberRole.ADMIN,
          entityType: 'RepurchaseEntry',
          entityId: mockRepurchaseEntry.id,
        }),
      );
    });

    it('should throw ConflictException if transactionRef already exists (service level check)', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(mockRepurchaseEntry);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 1500.5,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should catch DB-level P2002 error code and throw ConflictException', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(null);
      prisma.member.findFirst.mockResolvedValue(mockActiveMember);

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      prisma.repurchaseEntry.create.mockRejectedValue(p2002Error);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 1500.5,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if memberId/memberCode does not exist', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(null);
      prisma.member.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00002',
          memberId: 'non-existent-member-id',
          amount: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if member exists but is NOT active', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(null);
      prisma.member.findFirst.mockResolvedValue(mockInactiveMember);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00003',
          memberId: mockInactiveMember.id,
          amount: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. update (PUT /admin/repurchase/:id) & Audit Logging', () => {
    it('should update repurchase entry and log UPDATE_REPURCHASE_ENTRY to activity_logs', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseCommissionLedger.count.mockResolvedValue(0);
      prisma.repurchaseEntry.update.mockResolvedValue({
        ...mockRepurchaseEntry,
        amount: 2000,
      });

      const result = await service.update(
        mockRepurchaseEntry.id,
        { amount: 2000 },
        'admin-uuid-1',
        MemberRole.ADMIN,
      );

      expect(result.amount).toBe(2000);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'UPDATE_REPURCHASE_ENTRY',
          actorId: 'admin-uuid-1',
          actorRole: MemberRole.ADMIN,
          entityId: mockRepurchaseEntry.id,
        }),
      );
    });

    it('should throw BadRequestException and lock entry if commissions have been generated', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseCommissionLedger.count.mockResolvedValue(3); // Commissions generated!

      await expect(
        service.update(mockRepurchaseEntry.id, { amount: 2000 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('3. remove (DELETE /admin/repurchase/:id) & Audit Logging', () => {
    it('should soft-delete repurchase entry and log DELETE_REPURCHASE_ENTRY to activity_logs', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseCommissionLedger.count.mockResolvedValue(0);
      prisma.repurchaseEntry.update.mockResolvedValue({
        ...mockRepurchaseEntry,
        deletedAt: new Date(),
      });

      const result = await service.remove(mockRepurchaseEntry.id, 'admin-uuid-1', MemberRole.ADMIN);

      expect(result.message).toContain('soft-deleted successfully');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: 'DELETE_REPURCHASE_ENTRY',
          actorId: 'admin-uuid-1',
          actorRole: MemberRole.ADMIN,
          entityId: mockRepurchaseEntry.id,
        }),
      );
    });

    it('should throw BadRequestException and block delete if commissions have been generated', async () => {
      prisma.repurchaseEntry.findFirst.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseCommissionLedger.count.mockResolvedValue(3);

      await expect(service.remove(mockRepurchaseEntry.id)).rejects.toThrow(BadRequestException);
    });
  });
});
