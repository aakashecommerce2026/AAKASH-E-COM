"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportExportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const admin_reports_service_1 = require("./admin-reports.service");
const pdf_export_service_1 = require("./pdf-export.service");
const excel_export_service_1 = require("./excel-export.service");
let ReportExportProcessor = ReportExportProcessor_1 = class ReportExportProcessor {
    adminReportsService;
    pdfExportService;
    excelExportService;
    logger = new common_1.Logger(ReportExportProcessor_1.name);
    exportsDir = path.join(process.cwd(), 'exports');
    constructor(adminReportsService, pdfExportService, excelExportService) {
        this.adminReportsService = adminReportsService;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }
    async handleReportExport(job) {
        const { jobId, format, type, period, query } = job.data;
        this.logger.log(`Processing background report export job ${job.id} (Type: ${type}, Format: ${format})`);
        const reportData = await this.adminReportsService.getPeriodReport(period, query);
        let buffer;
        let extension;
        if (format === 'pdf') {
            buffer = await this.pdfExportService.generateReportPdf(type, period, reportData);
            extension = 'pdf';
        }
        else {
            buffer = await this.excelExportService.generateReportExcel(type, period, reportData);
            extension = 'xlsx';
        }
        const filename = `report_${type}_${period}_${jobId}.${extension}`;
        const filePath = path.join(this.exportsDir, filename);
        fs.writeFileSync(filePath, buffer);
        this.logger.log(`Export job ${job.id} completed. Saved file to ${filePath}`);
        return {
            jobId,
            filename,
            filePath,
            format,
            downloadUrl: `/admin/reports/export/download/${filename}`,
            completedAt: new Date().toISOString(),
        };
    }
};
exports.ReportExportProcessor = ReportExportProcessor;
__decorate([
    (0, bull_1.Process)('generate-report'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportExportProcessor.prototype, "handleReportExport", null);
exports.ReportExportProcessor = ReportExportProcessor = ReportExportProcessor_1 = __decorate([
    (0, bull_1.Processor)('report-export-queue'),
    __metadata("design:paramtypes", [admin_reports_service_1.AdminReportsService,
        pdf_export_service_1.PdfExportService,
        excel_export_service_1.ExcelExportService])
], ReportExportProcessor);
//# sourceMappingURL=report-export.processor.js.map