import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import {
  RepurchaseCommissionService,
  DEFAULT_REPURCHASE_COMMISSION_RATES,
} from './repurchase-commission.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('RepurchaseCommissionService Configuration & Startup 5% Sum Validation', () => {
  let service: RepurchaseCommissionService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      repurchaseCommissionConfig: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        createMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepurchaseCommissionService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<RepurchaseCommissionService>(RepurchaseCommissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('1. Startup 5% Sum Validation (validateStartupConfig)', () => {
    it('should pass startup validation when active config percentages sum to EXACTLY 5.00% across 20 levels', async () => {
      prisma.repurchaseCommissionConfig.findFirst.mockResolvedValue({ version: 1 });
      prisma.repurchaseCommissionConfig.findMany.mockResolvedValue(
        DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
          ...r,
          id: `id-${r.level}`,
          version: 1,
          isActive: true,
          percentage: r.percentage,
        })),
      );

      await expect(service.validateStartupConfig()).resolves.not.toThrow();
    });

    it('should throw critical configuration error on startup if sum is NOT 5.00% (e.g. 5.50%)', async () => {
      prisma.repurchaseCommissionConfig.findFirst.mockResolvedValue({ version: 1 });
      const badRates = DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
        ...r,
        id: `id-${r.level}`,
        version: 1,
        isActive: true,
        percentage: r.level === 1 ? 2.0 : r.percentage, // 2.0 + rest = 5.50%
      }));
      prisma.repurchaseCommissionConfig.findMany.mockResolvedValue(badRates);

      await expect(service.validateStartupConfig()).rejects.toThrow(
        /CRITICAL CONFIGURATION ERROR/i,
      );
    });

    it('should throw critical configuration error if level count is NOT 20 (e.g. 19 levels)', async () => {
      prisma.repurchaseCommissionConfig.findFirst.mockResolvedValue({ version: 1 });
      const badRates = DEFAULT_REPURCHASE_COMMISSION_RATES.slice(0, 19).map((r) => ({
        ...r,
        id: `id-${r.level}`,
        version: 1,
        isActive: true,
        percentage: r.percentage,
      }));
      prisma.repurchaseCommissionConfig.findMany.mockResolvedValue(badRates);

      await expect(service.validateStartupConfig()).rejects.toThrow(
        /CRITICAL CONFIGURATION ERROR/i,
      );
    });
  });

  describe('2. getActiveConfig', () => {
    it('should return fallback 20-level default rates if DB table is unseeded', async () => {
      prisma.repurchaseCommissionConfig.findFirst.mockResolvedValue(null);

      const config = await service.getActiveConfig();
      expect(config.length).toBe(20);
      const totalSum = config.reduce((acc, c) => acc + c.percentage, 0);
      expect(Math.round(totalSum * 100) / 100).toBe(5.00);
    });
  });

  describe('3. validateRatesSum & updateConfig', () => {
    it('should reject updateConfig if rates do not sum to 5.00%', async () => {
      const invalidRates = DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
        ...r,
        percentage: r.level === 1 ? 10.0 : r.percentage,
      }));

      await expect(service.updateConfig({ rates: invalidRates })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update and activate new versioned config when rates sum to 5.00%', async () => {
      prisma.repurchaseCommissionConfig.findFirst.mockResolvedValue({ version: 1 });
      prisma.repurchaseCommissionConfig.findMany.mockResolvedValue(
        DEFAULT_REPURCHASE_COMMISSION_RATES.map((r) => ({
          ...r,
          id: `id-v2-${r.level}`,
          version: 2,
          isActive: true,
        })),
      );

      const result = await service.updateConfig(
        { rates: DEFAULT_REPURCHASE_COMMISSION_RATES },
        'admin-uuid-1',
      );

      expect(result.length).toBe(20);
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: 'UPDATE_REPURCHASE_COMMISSION_CONFIG' }),
      );
    });
  });
});
