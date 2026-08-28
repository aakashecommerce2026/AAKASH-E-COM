"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportExportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const admin_reports_service_1 = require("../admin-reports.service");
const report_pdf_export_service_1 = require("./report-pdf-export.service");
const report_excel_export_service_1 = require("./report-excel-export.service");
let ReportExportProcessor = ReportExportProcessor_1 = class ReportExportProcessor {
    adminReportsService;
    pdfExportService;
    excelExportService;
    logger = new common_1.Logger(ReportExportProcessor_1.name);
    constructor(adminReportsService, pdfExportService, excelExportService) {
        this.adminReportsService = adminReportsService;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
    }
    async handleGenerateExport(job) {
        this.logger.log(`Processing report export job ${job.id} (${job.data.format.toUpperCase()} - ${job.data.type})`);
        const { format, period, type, startDate, endDate } = job.data;
        const reportData = await this.adminReportsService.getPeriodReport(period, {
            type,
            startDate,
            endDate,
        });
        let buffer;
        if (format === 'pdf') {
            buffer = await this.pdfExportService.generatePdf(reportData, period, type);
        }
        else {
            buffer = await this.excelExportService.generateExcel(reportData, period, type);
        }
        this.logger.log(`Export job ${job.id} completed. Generated ${buffer.length} bytes.`);
        return {
            status: 'COMPLETED',
            format,
            period,
            type,
            sizeBytes: buffer.length,
            generatedAt: new Date().toISOString(),
            base64Content: buffer.toString('base64'),
        };
    }
};
exports.ReportExportProcessor = ReportExportProcessor;
__decorate([
    (0, bull_1.Process)('generate-export'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportExportProcessor.prototype, "handleGenerateExport", null);
exports.ReportExportProcessor = ReportExportProcessor = ReportExportProcessor_1 = __decorate([
    (0, bull_1.Processor)('reports-export'),
    __metadata("design:paramtypes", [admin_reports_service_1.AdminReportsService,
        report_pdf_export_service_1.ReportPdfExportService,
        report_excel_export_service_1.ReportExcelExportService])
], ReportExportProcessor);
//# sourceMappingURL=report-export-queue.processor.js.map