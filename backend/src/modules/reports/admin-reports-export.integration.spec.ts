import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { AdminReportsExportController } from './admin-reports-export.controller';
import { AdminReportsService } from './admin-reports.service';
import { ReportPdfExportService } from './export/report-pdf-export.service';
import { ReportExcelExportService } from './export/report-excel-export.service';
import { ReportType } from './dto/query-period-report.dto';

describe('Admin Reports Export Integration Test Suite', () => {
  let controller: AdminReportsExportController;
  let reportsService: AdminReportsService;
  let pdfService: ReportPdfExportService;
  let excelService: ReportExcelExportService;
  let mockQueue: any;

  const mockReportData = {
    periodType: 'daily',
    dateRange: {
      startDate: '2026-08-01T00:00:00.000Z',
      endDate: '2026-08-19T23:59:59.999Z',
    },
    summary: { totalRegistrations: 10, activeRegistrations: 8 },
    trend: [
      {
        period: '2026-08-19',
        totalRegistrations: 2,
        activeCount: 2,
        pendingCount: 0,
      },
    ],
    data: [
      { id: '1', memberCode: 'AK1001', name: 'John Doe', status: 'ACTIVE' },
    ],
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
      getJob: jest.fn().mockImplementation(async (id: string) => {
        if (id === 'job-123') {
          return {
            id: 'job-123',
            getState: jest.fn().mockResolvedValue('completed'),
            progress: jest.fn().mockReturnValue(100),
            returnvalue: { status: 'COMPLETED', sizeBytes: 2048 },
          };
        }
        return null;
      }),
    };

    const mockReportsService = {
      getPeriodReport: jest.fn().mockResolvedValue(mockReportData),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsExportController],
      providers: [
        { provide: AdminReportsService, useValue: mockReportsService },
        ReportPdfExportService,
        ReportExcelExportService,
        { provide: getQueueToken('reports-export'), useValue: mockQueue },
      ],
    }).compile();

    controller = module.get<AdminReportsExportController>(
      AdminReportsExportController,
    );
    reportsService = module.get<AdminReportsService>(AdminReportsService);
    pdfService = module.get<ReportPdfExportService>(ReportPdfExportService);
    excelService = module.get<ReportExcelExportService>(
      ReportExcelExportService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(pdfService).toBeDefined();
    expect(excelService).toBeDefined();
  });

  describe('1. GET /admin/reports/export/pdf', () => {
    it('should generate PDF buffer synchronously when async is false', async () => {
      const mockRes: any = {
        setHeader: jest.fn(),
        send: jest.fn().mockImplementation((buf) => buf),
      };

      const result = await controller.exportPdf(
        {
          type: ReportType.MEMBER_REGISTRATIONS,
          period: 'daily',
          async: false,
        },
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should queue export job when async is true', async () => {
      const mockRes: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((body) => body),
      };

      const result: any = await controller.exportPdf(
        { type: ReportType.MEMBER_REGISTRATIONS, period: 'daily', async: true },
        mockRes,
      );

      expect(mockQueue.add).toHaveBeenCalled();
      expect(result.status).toBe('QUEUED');
      expect(result.jobId).toBe('job-123');
    });
  });

  describe('2. GET /admin/reports/export/excel', () => {
    it('should generate Excel buffer synchronously when async is false', async () => {
      const mockRes: any = {
        setHeader: jest.fn(),
        send: jest.fn().mockImplementation((buf) => buf),
      };

      const result = await controller.exportExcel(
        {
          type: ReportType.REPURCHASE_ACTIVITIES,
          period: 'daily',
          async: false,
        },
        mockRes,
      );

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('3. GET /admin/reports/export/jobs/:id', () => {
    it('should return job status for completed export job', async () => {
      const mockRes: any = {
        json: jest.fn().mockImplementation((body) => body),
      };

      const result: any = await controller.getJobStatus('job-123', mockRes);

      expect(result).toBeDefined();
      expect(result.status).toBe('COMPLETED');
      expect(result.id).toBe('job-123');
    });
  });
});
