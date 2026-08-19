import { Test, TestingModule } from '@nestjs/testing';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { ReportType, PeriodTypeEnum } from './dto/query-period-report.dto';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

describe('Admin Reports Export Test Suite', () => {
  let controller: AdminReportsController;
  let adminReportsService: AdminReportsService;
  let pdfExportService: PdfExportService;
  let excelExportService: ExcelExportService;

  const mockReportData = {
    periodType: 'daily',
    dateRange: { startDate: '2026-08-01T00:00:00.000Z', endDate: '2026-08-19T23:59:59.999Z' },
    summary: {
      totalRegistrations: 10,
      activeCount: 8,
      totalVolume: 5000,
    },
    trend: [
      { period: '2026-08-19', totalRegistrations: 10, activeCount: 8 },
    ],
    data: [
      { id: 'mem-1', memberCode: 'AK1001', name: 'Test Member', status: 'ACTIVE' },
    ],
  };

  const createMockResponse = () => {
    const res: Partial<Response> = {};
    res.setHeader = jest.fn();
    res.send = jest.fn().mockImplementation((val) => val);
    res.sendFile = jest.fn().mockImplementation((val) => val);
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockImplementation((val) => val);
    return res as Response;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminReportsController],
      providers: [
        PdfExportService,
        ExcelExportService,
        {
          provide: AdminReportsService,
          useValue: {
            getPeriodReport: jest.fn().mockResolvedValue(mockReportData),
          },
        },
        {
          provide: 'BullQueue_report-export-queue',
          useValue: {
            add: jest.fn().mockResolvedValue({ id: 'job-123' }),
            getJob: jest.fn().mockResolvedValue({
              id: 'job-123',
              getState: jest.fn().mockResolvedValue('completed'),
              progress: jest.fn().mockReturnValue(100),
              returnvalue: { downloadUrl: '/admin/reports/export/download/report.pdf' },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminReportsController>(AdminReportsController);
    adminReportsService = module.get<AdminReportsService>(AdminReportsService);
    pdfExportService = module.get<PdfExportService>(PdfExportService);
    excelExportService = module.get<ExcelExportService>(ExcelExportService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(pdfExportService).toBeDefined();
    expect(excelExportService).toBeDefined();
  });

  describe('1. PdfExportService', () => {
    it('should generate valid PDF buffer starting with %PDF', async () => {
      const buffer = await pdfExportService.generateReportPdf(
        ReportType.BUSINESS_SUMMARY,
        'daily',
        mockReportData,
      );

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.toString('utf8', 0, 4)).toBe('%PDF');
    });
  });

  describe('2. ExcelExportService', () => {
    it('should generate valid Excel buffer', async () => {
      const buffer = await excelExportService.generateReportExcel(
        ReportType.MEMBER_REGISTRATIONS,
        'monthly',
        mockReportData,
      );

      expect(buffer).toBeDefined();
      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(100);
    });
  });

  describe('3. AdminReportsController Synchronous PDF Export', () => {
    it('should stream PDF file directly when async is false', async () => {
      const res = createMockResponse();
      await controller.exportPdf(
        { type: ReportType.BUSINESS_SUMMARY, period: PeriodTypeEnum.DAILY, async: false },
        res,
      );

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename='),
      );
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('4. AdminReportsController Synchronous Excel Export', () => {
    it('should stream Excel file directly when async is false', async () => {
      const res = createMockResponse();
      await controller.exportExcel(
        { type: ReportType.EARNINGS_SUMMARY, period: PeriodTypeEnum.WEEKLY, async: false },
        res,
      );

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('5. AdminReportsController Async Export via Bull Queue', () => {
    it('should return 202 queued response when async is true', async () => {
      const res = createMockResponse();
      await controller.exportPdf(
        { type: ReportType.REPURCHASE_ACTIVITIES, period: PeriodTypeEnum.DAILY, async: true },
        res,
      );

      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'queued',
          jobId: expect.any(String),
          downloadUrl: expect.stringContaining('/admin/reports/export/download/'),
        }),
      );
    });
  });

  describe('6. AdminReportsController Export Job Status & Download', () => {
    it('should return export status by jobId', async () => {
      const result = await controller.getExportStatus('job-123');

      expect(result).toBeDefined();
      expect(result.jobId).toBe('job-123');
      expect(result.status).toBe('completed');
    });

    it('should download generated file if file exists on disk', async () => {
      const exportsDir = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
      }
      const testFile = path.join(exportsDir, 'test_export.pdf');
      fs.writeFileSync(testFile, 'dummy pdf content');

      const res = createMockResponse();
      await controller.downloadExportFile('test_export.pdf', res);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.sendFile).toHaveBeenCalledWith(testFile);

      // Clean up test file
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    });
  });
});
