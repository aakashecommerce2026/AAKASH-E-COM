import { Test, TestingModule } from '@nestjs/testing';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportType } from './dto/query-period-report.dto';
import { MemberStatus, CommissionStatus } from '@prisma/client';

describe('Admin Periodic Reports Integration Test Suite', () => {
  let controller: AdminReportsController;
  let service: AdminReportsService;
  let prisma: any;

  const mockDate = new Date('2026-08-19T10:00:00.000Z');

  beforeEach(async () => {
    prisma = {
      member: {
        count: jest.fn().mockResolvedValue(10),
        groupBy: jest.fn().mockResolvedValue([
          { status: MemberStatus.ACTIVE, _count: { id: 8 } },
          { status: MemberStatus.PENDING, _count: { id: 2 } },
        ]),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'mem-1',
            memberCode: 'AK1001',
            name: 'John Member',
            email: 'john@example.com',
            mobile: '+919876543210',
            status: MemberStatus.ACTIVE,
            role: 'MEMBER',
            joiningDate: mockDate,
            referrer: { id: 'ref-1', memberCode: 'AK1000', name: 'Sponsor User' },
          },
        ]),
      },
      repurchaseEntry: {
        count: jest.fn().mockResolvedValue(5),
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 5000 },
          _avg: { amount: 1000 },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rep-1',
            transactionRef: 'TXN1001',
            memberId: 'mem-1',
            amount: 1000,
            transactionDate: mockDate,
            remarks: 'Product Order',
            member: { id: 'mem-1', memberCode: 'AK1001', name: 'John Member', mobile: '+919876543210' },
          },
        ]),
      },
      repurchaseCommissionLedger: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 500 },
          _count: { id: 5 },
        }),
        findMany: jest.fn().mockResolvedValue([
          { createdAt: mockDate, amount: 100 },
        ]),
      },
      membershipCommissionLedger: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { amount: 1500 },
          _count: { id: 10 },
        }),
        findMany: jest.fn().mockResolvedValue([
          { createdAt: mockDate, amount: 150 },
        ]),
      },
      distributionRecord: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { grossAmount: 1200, netAmount: 1080, tdsAmount: 60, adminFee: 60 },
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [
        AdminReportsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<AdminReportsController>(AdminReportsController);
    service = module.get<AdminReportsService>(AdminReportsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  describe('1. GET /admin/reports/daily?type=member-registrations', () => {
    it('should return structured daily member registrations report', async () => {
      const result = await controller.getDailyReport({
        type: ReportType.MEMBER_REGISTRATIONS,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('daily');
      expect(result.summary.totalRegistrations).toBe(10);
      expect(result.summary.statusBreakdown.ACTIVE).toBe(8);
      expect(result.data.length).toBe(1);
    });
  });

  describe('2. GET /admin/reports/daily?type=repurchase-activities', () => {
    it('should return structured daily repurchase activities report', async () => {
      const result = await controller.getDailyReport({
        type: ReportType.REPURCHASE_ACTIVITIES,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('daily');
      expect(result.summary.totalOrders).toBe(5);
      expect(result.summary.totalVolume).toBe(5000);
      expect(result.summary.averageOrderValue).toBe(1000);
    });
  });

  describe('3. GET /admin/reports/daily?type=earnings-summary', () => {
    it('should return structured daily earnings summary report', async () => {
      const result = await controller.getDailyReport({
        type: ReportType.EARNINGS_SUMMARY,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('daily');
      expect(result.summary.totalMembershipEarnings).toBe(1500);
      expect(result.summary.totalRepurchaseEarnings).toBe(500);
      expect(result.summary.totalEarnings).toBe(2000);
      expect(result.summary.totalGrossDistributed).toBe(1200);
    });
  });

  describe('4. GET /admin/reports/daily?type=business-summary', () => {
    it('should return combined business summary report', async () => {
      const result = await controller.getDailyReport({
        type: ReportType.BUSINESS_SUMMARY,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('daily');
      expect(result.summary.totalRegistrations).toBe(10);
      expect(result.summary.repurchaseOrders).toBe(5);
      expect(result.summary.repurchaseVolume).toBe(5000);
      expect(result.summary.totalEarningsGenerated).toBe(2000);
    });
  });

  describe('5. GET /admin/reports/weekly & GET /admin/reports/monthly', () => {
    it('should return weekly business summary report', async () => {
      const result = await controller.getWeeklyReport({
        type: ReportType.BUSINESS_SUMMARY,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('weekly');
    });

    it('should return monthly earnings summary report', async () => {
      const result = await controller.getMonthlyReport({
        type: ReportType.EARNINGS_SUMMARY,
      });

      expect(result).toBeDefined();
      expect(result.periodType).toBe('monthly');
    });
  });
});
