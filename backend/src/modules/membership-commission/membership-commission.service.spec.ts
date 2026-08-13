import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembershipCommissionService } from './membership-commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('MembershipCommissionService Unit Tests', () => {
  let service: MembershipCommissionService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      membershipCommissionConfig: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
        upsert: jest.fn(),
        createMany: jest.fn(),
      },
      membershipCommissionLedger: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      member: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipCommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<MembershipCommissionService>(MembershipCommissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Versioned Config Lookup & Management', () => {
    it('should return fallback 20-level default rates when DB has no versioned config', async () => {
      prisma.membershipCommissionConfig.findFirst.mockResolvedValue(null);

      const rates = await service.getActiveConfig();

      expect(rates.length).toBe(20);
      expect(rates[0].level).toBe(1);
      expect(rates[0].percentage).toBe(10);
      expect(rates[1].level).toBe(2);
      expect(rates[1].percentage).toBe(5);
      expect(rates[2].level).toBe(3);
      expect(rates[2].percentage).toBe(2.5);
      expect(rates[6].level).toBe(7);
      expect(rates[6].percentage).toBe(0.5);
      expect(rates[19].level).toBe(20);
      expect(rates[19].percentage).toBe(0.5);
    });

    it('should fetch active config schedule for latest active version', async () => {
      prisma.membershipCommissionConfig.findFirst.mockResolvedValue({ version: 2 });
      prisma.membershipCommissionConfig.findMany.mockResolvedValue([
        { id: 'c1', version: 2, level: 1, percentage: 12.0, isActive: true },
        { id: 'c2', version: 2, level: 2, percentage: 6.0, isActive: true },
      ]);

      const rates = await service.getActiveConfig();

      expect(rates.length).toBe(2);
      expect(rates[0].percentage).toBe(12.0);
      expect(rates[1].percentage).toBe(6.0);
    });

    it('should publish a new versioned percentage schedule and deactivate older ones', async () => {
      const ratesDto = [
        { level: 1, percentage: 15.0, description: 'Updated Level 1' },
        { level: 2, percentage: 7.5, description: 'Updated Level 2' },
      ];

      prisma.membershipCommissionConfig.upsert.mockImplementation(({ create }: any) =>
        Promise.resolve({ id: `cfg-${create.level}`, ...create }),
      );

      const result = await service.publishConfigVersion(
        { version: 2, rates: ratesDto, isActive: true },
        'admin-id',
      );

      expect(prisma.membershipCommissionConfig.updateMany).toHaveBeenCalledWith({
        where: { isActive: true },
        data: { isActive: false },
      });
      expect(result.length).toBe(2);
      expect(result[0].percentage).toBe(15.0);
      expect(auditService.logAction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if level is out of 1..20 bounds or duplicated', async () => {
      await expect(
        service.publishConfigVersion({
          version: 2,
          rates: [{ level: 25, percentage: 10.0 }],
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.publishConfigVersion({
          version: 2,
          rates: [
            { level: 1, percentage: 10.0 },
            { level: 1, percentage: 5.0 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('2. Trigger-on-Registration Commission Engine', () => {
    it('should skip calculation if commissions already exist for source member (Idempotency)', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(1);
      prisma.membershipCommissionLedger.findMany.mockResolvedValue([
        {
          id: 'ledger-1',
          sourceMemberId: 'm-new',
          beneficiaryMemberId: 'm-upline-1',
          level: 1,
          percentage: 10,
          amount: 100,
          status: 'CALCULATED',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const res = await service.processRegistrationCommissions('m-new', 1000);

      expect(res.length).toBe(1);
      expect(prisma.membershipCommissionLedger.create).not.toHaveBeenCalled();
    });

    it('should return empty list if newly registered member has no referrer', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(0);
      prisma.member.findUnique.mockResolvedValue({
        id: 'm-root',
        memberCode: 'AK10001',
        referrerId: null,
      });

      const res = await service.processRegistrationCommissions('m-root', 1000);

      expect(res).toEqual([]);
      expect(prisma.membershipCommissionLedger.create).not.toHaveBeenCalled();
    });

    it('should calculate 20-level upline commissions correctly for package amount of 1000', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(0);
      prisma.membershipCommissionConfig.findFirst.mockResolvedValue(null); // use 20-level defaults

      const memberMap = new Map<string, any>();
      memberMap.set('m-new', { id: 'm-new', memberCode: 'AK20', referrerId: 'm-up-1' });

      for (let i = 1; i <= 20; i++) {
        const id = `m-up-${i}`;
        const parentId = i < 20 ? `m-up-${i + 1}` : null;
        memberMap.set(id, { id, memberCode: `AK${20 - i}`, referrerId: parentId, status: 'ACTIVE' });
      }

      prisma.member.findUnique.mockImplementation(({ where }: any) =>
        Promise.resolve(memberMap.get(where.id) || null),
      );

      prisma.membershipCommissionLedger.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: `led-${data.level}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const results = await service.processRegistrationCommissions('m-new', 1000);

      expect(results.length).toBe(20);

      // Level 1: 10% of 1000 = 100
      expect(results[0].level).toBe(1);
      expect(results[0].beneficiaryMemberId).toBe('m-up-1');
      expect(results[0].percentage).toBe(10);
      expect(results[0].amount).toBe(100);

      // Level 2: 5% of 1000 = 50
      expect(results[1].level).toBe(2);
      expect(results[1].beneficiaryMemberId).toBe('m-up-2');
      expect(results[1].percentage).toBe(5);
      expect(results[1].amount).toBe(50);

      // Level 3: 2.5% of 1000 = 25
      expect(results[2].level).toBe(3);
      expect(results[2].percentage).toBe(2.5);
      expect(results[2].amount).toBe(25);

      // Level 4: 1.5% of 1000 = 15
      expect(results[3].level).toBe(4);
      expect(results[3].percentage).toBe(1.5);
      expect(results[3].amount).toBe(15);

      // Level 20: 0.5% of 1000 = 5
      expect(results[19].level).toBe(20);
      expect(results[19].percentage).toBe(0.5);
      expect(results[19].amount).toBe(5);
    });

    it('should detect circular referral chain and prevent infinite loops', async () => {
      prisma.membershipCommissionLedger.count.mockResolvedValue(0);
      prisma.membershipCommissionConfig.findFirst.mockResolvedValue(null);

      // Create cycle: m-new -> m-up-1 -> m-new
      prisma.member.findUnique.mockImplementation(({ where }: any) => {
        if (where.id === 'm-new') return Promise.resolve({ id: 'm-new', memberCode: 'AK1', referrerId: 'm-up-1' });
        if (where.id === 'm-up-1') return Promise.resolve({ id: 'm-up-1', memberCode: 'AK2', referrerId: 'm-new' });
        return Promise.resolve(null);
      });

      prisma.membershipCommissionLedger.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: `led-${data.level}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      const results = await service.processRegistrationCommissions('m-new', 1000);

      // Cycle encountered after L1: should process level 1 then break
      expect(results.length).toBe(1);
    });
  });
});
