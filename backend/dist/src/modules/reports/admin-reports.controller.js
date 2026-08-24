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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const bull_1 = require("@nestjs/bull");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const admin_reports_service_1 = require("./admin-reports.service");
const pdf_export_service_1 = require("./pdf-export.service");
const excel_export_service_1 = require("./excel-export.service");
const query_period_report_dto_1 = require("./dto/query-period-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminReportsController = class AdminReportsController {
    adminReportsService;
    pdfExportService;
    excelExportService;
    exportQueue;
    exportsDir = path.join(process.cwd(), 'exports');
    constructor(adminReportsService, pdfExportService, excelExportService, exportQueue) {
        this.adminReportsService = adminReportsService;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
        this.exportQueue = exportQueue;
        if (!fs.existsSync(this.exportsDir)) {
            fs.mkdirSync(this.exportsDir, { recursive: true });
        }
    }
    async getDailyReport(query) {
        return this.adminReportsService.getPeriodReport('daily', query);
    }
    async getWeeklyReport(query) {
        return this.adminReportsService.getPeriodReport('weekly', query);
    }
    async getMonthlyReport(query) {
        return this.adminReportsService.getPeriodReport('monthly', query);
    }
    async exportPdf(query, res) {
        const period = query.period || 'daily';
        if (query.async) {
            return this.handleAsyncExport('pdf', period, query, res);
        }
        const reportData = await this.adminReportsService.getPeriodReport(period, query);
        const pdfBuffer = await this.pdfExportService.generateReportPdf(query.type, period, reportData);
        const filename = `report_${query.type}_${period}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);
    }
    async exportExcel(query, res) {
        const period = query.period || 'daily';
        if (query.async) {
            return this.handleAsyncExport('excel', period, query, res);
        }
        const reportData = await this.adminReportsService.getPeriodReport(period, query);
        const excelBuffer = await this.excelExportService.generateReportExcel(query.type, period, reportData);
        const filename = `report_${query.type}_${period}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(excelBuffer);
    }
    async getExportStatus(jobId) {
        if (!this.exportQueue) {
            return {
                jobId,
                status: 'completed',
                message: 'Direct execution mode (Queue offline)',
            };
        }
        const job = await this.exportQueue.getJob(jobId);
        if (!job) {
            throw new common_1.NotFoundException(`Export job '${jobId}' not found`);
        }
        const state = await job.getState();
        const returnvalue = job.returnvalue;
        return {
            jobId,
            status: state,
            progress: job.progress(),
            result: returnvalue || null,
            failedReason: job.failedReason || null,
        };
    }
    async downloadExportFile(filename, res) {
        const safeFilename = path.basename(filename);
        const filePath = path.join(this.exportsDir, safeFilename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException(`Exported file '${safeFilename}' not found or expired`);
        }
        const ext = path.extname(safeFilename).toLowerCase();
        const contentType = ext === '.pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
        return res.sendFile(filePath);
    }
    async handleAsyncExport(format, period, query, res) {
        const jobId = `export_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        if (this.exportQueue) {
            try {
                await this.exportQueue.add('generate-report', {
                    jobId,
                    format,
                    type: query.type,
                    period,
                    query,
                });
                const ext = format === 'pdf' ? 'pdf' : 'xlsx';
                const expectedFilename = `report_${query.type}_${period}_${jobId}.${ext}`;
                return res.status(202).json({
                    jobId,
                    status: 'queued',
                    message: 'Report export job successfully enqueued for background processing.',
                    statusUrl: `/admin/reports/export/status/${jobId}`,
                    downloadUrl: `/admin/reports/export/download/${expectedFilename}`,
                });
            }
            catch (error) {
            }
        }
        const reportData = await this.adminReportsService.getPeriodReport(period, query);
        const buffer = format === 'pdf'
            ? await this.pdfExportService.generateReportPdf(query.type, period, reportData)
            : await this.excelExportService.generateReportExcel(query.type, period, reportData);
        const ext = format === 'pdf' ? 'pdf' : 'xlsx';
        const filename = `report_${query.type}_${period}_${jobId}.${ext}`;
        const filePath = path.join(this.exportsDir, filename);
        fs.writeFileSync(filePath, buffer);
        return res.status(200).json({
            jobId,
            status: 'completed',
            message: 'Report generated synchronously.',
            downloadUrl: `/admin/reports/export/download/${filename}`,
        });
    }
};
exports.AdminReportsController = AdminReportsController;
__decorate([
    (0, common_1.Get)('daily'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/daily — Daily reports for member registrations, repurchase, earnings, or business summary',
        description: 'Generates daily-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Structured JSON daily report output',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_period_report_dto_1.QueryPeriodReportDto]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "getDailyReport", null);
__decorate([
    (0, common_1.Get)('weekly'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/weekly — Weekly reports for member registrations, repurchase, earnings, or business summary',
        description: 'Generates weekly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Structured JSON weekly report output',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_period_report_dto_1.QueryPeriodReportDto]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "getWeeklyReport", null);
__decorate([
    (0, common_1.Get)('monthly'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/monthly — Monthly reports for member registrations, repurchase, earnings, or business summary',
        description: 'Generates monthly-bucketed reports for member registrations, repurchase activities, earnings summary, or business summary.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Structured JSON monthly report output',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_period_report_dto_1.QueryPeriodReportDto]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.Get)('export/pdf'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/pdf — Export reports to PDF format',
        description: 'Builds a PDF report document using pdf-lib. If async=true, enqueues Bull queue job and returns download link.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF file binary stream or queued background job details',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_period_report_dto_1.QueryPeriodReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)('export/excel'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/excel — Export reports to Excel format using ExcelJS',
        description: 'Builds an Excel spreadsheet matching report type column headers. If async=true, enqueues Bull queue job.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Excel spreadsheet binary stream or queued background job details',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_period_report_dto_1.QueryPeriodReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)('export/status/:jobId'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/status/:jobId — Check background export job status',
        description: 'Queries status of background report export job dispatched to Bull queue.',
    }),
    (0, swagger_1.ApiParam)({
        name: 'jobId',
        description: 'Job ID returned when enqueuing export',
    }),
    __param(0, (0, common_1.Param)('jobId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "getExportStatus", null);
__decorate([
    (0, common_1.Get)('export/download/:filename'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/download/:filename — Download generated export file',
        description: 'Downloads previously generated report export file stored on disk.',
    }),
    (0, swagger_1.ApiParam)({ name: 'filename', description: 'Filename of exported report' }),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsController.prototype, "downloadExportFile", null);
exports.AdminReportsController = AdminReportsController = __decorate([
    (0, swagger_1.ApiTags)('Admin Periodic Reports'),
    (0, common_1.Controller)('admin/reports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __param(3, (0, common_1.Optional)()),
    __param(3, (0, bull_1.InjectQueue)('report-export-queue')),
    __metadata("design:paramtypes", [admin_reports_service_1.AdminReportsService,
        pdf_export_service_1.PdfExportService,
        excel_export_service_1.ExcelExportService, Object])
], AdminReportsController);
//# sourceMappingURL=admin-reports.controller.js.map