import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { RepurchaseService } from './repurchase.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberStatus } from '@prisma/client';

describe('RepurchaseService Unit Tests', () => {
  let service: RepurchaseService;
  let prisma: any;
  let auditService: any;

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
  };

  beforeEach(async () => {
    prisma = {
      repurchaseEntry: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      member: {
        findUnique: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepurchaseService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<RepurchaseService>(RepurchaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. create', () => {
    it('should create a repurchase entry successfully when member exists and is ACTIVE', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(null); // transactionRef check
      prisma.member.findUnique.mockResolvedValue(mockActiveMember); // member check
      prisma.repurchaseEntry.create.mockResolvedValue(mockRepurchaseEntry);

      const result = await service.create({
        transactionRef: 'REP-2026-00001',
        memberId: mockActiveMember.id,
        amount: 1500.5,
        remarks: 'Monthly repurchase',
      });

      expect(result.id).toEqual(mockRepurchaseEntry.id);
      expect(result.amount).toEqual(1500.5);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'CREATE_REPURCHASE_ENTRY' }),
      );
    });

    it('should throw ConflictException if transactionRef already exists', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(mockRepurchaseEntry);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00001',
          memberId: mockActiveMember.id,
          amount: 1500.5,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if memberId does not exist', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00002',
          memberId: 'non-existent-member-id',
          amount: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if member exists but is NOT active (e.g. BLOCKED)', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(null);
      prisma.member.findUnique.mockResolvedValue(mockInactiveMember);

      await expect(
        service.create({
          transactionRef: 'REP-2026-00003',
          memberId: mockInactiveMember.id,
          amount: 1000,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. findAll', () => {
    it('should return paginated list of repurchase entries', async () => {
      prisma.repurchaseEntry.count.mockResolvedValue(1);
      prisma.repurchaseEntry.findMany.mockResolvedValue([mockRepurchaseEntry]);

      const result = await service.findAll({ page: 1, limit: 10, search: 'REP' });

      expect(result.data.length).toBe(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });
  });

  describe('3. findById', () => {
    it('should return single repurchase entry by id', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(mockRepurchaseEntry);

      const result = await service.findById(mockRepurchaseEntry.id);
      expect(result.id).toBe(mockRepurchaseEntry.id);
    });

    it('should throw NotFoundException if entry not found', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('4. update', () => {
    it('should update repurchase entry', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseEntry.update.mockResolvedValue({
        ...mockRepurchaseEntry,
        amount: 2000,
      });

      const result = await service.update(mockRepurchaseEntry.id, { amount: 2000 });
      expect(result.amount).toBe(2000);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'UPDATE_REPURCHASE_ENTRY' }),
      );
    });

    it('should throw ConflictException if updating to an existing transactionRef', async () => {
      prisma.repurchaseEntry.findUnique
        .mockResolvedValueOnce(mockRepurchaseEntry) // target lookup
        .mockResolvedValueOnce({ id: 'other-id', transactionRef: 'REP-EXISTING' }); // collision check

      await expect(
        service.update(mockRepurchaseEntry.id, { transactionRef: 'REP-EXISTING' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('5. remove', () => {
    it('should delete repurchase entry', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(mockRepurchaseEntry);
      prisma.repurchaseEntry.delete.mockResolvedValue(mockRepurchaseEntry);

      const result = await service.remove(mockRepurchaseEntry.id);
      expect(result.message).toContain('deleted successfully');
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'DELETE_REPURCHASE_ENTRY' }),
      );
    });

    it('should throw NotFoundException if repurchase entry does not exist', async () => {
      prisma.repurchaseEntry.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
