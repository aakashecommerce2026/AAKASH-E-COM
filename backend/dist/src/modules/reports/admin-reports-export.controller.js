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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminReportsExportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const bull_1 = require("@nestjs/bull");
const admin_reports_service_1 = require("./admin-reports.service");
const report_pdf_export_service_1 = require("./export/report-pdf-export.service");
const report_excel_export_service_1 = require("./export/report-excel-export.service");
const query_export_report_dto_1 = require("./dto/query-export-report.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let AdminReportsExportController = class AdminReportsExportController {
    adminReportsService;
    pdfExportService;
    excelExportService;
    reportsExportQueue;
    constructor(adminReportsService, pdfExportService, excelExportService, reportsExportQueue) {
        this.adminReportsService = adminReportsService;
        this.pdfExportService = pdfExportService;
        this.excelExportService = excelExportService;
        this.reportsExportQueue = reportsExportQueue;
    }
    async exportPdf(query, res) {
        const period = query.period || 'daily';
        if (query.async) {
            const job = await this.reportsExportQueue.add('generate-export', {
                format: 'pdf',
                period,
                type: query.type,
                startDate: query.startDate,
                endDate: query.endDate,
            });
            return res.status(202).json({
                jobId: job.id,
                status: 'QUEUED',
                message: 'Report export job queued. Download link available upon completion at GET /admin/reports/export/jobs/' +
                    job.id,
            });
        }
        const reportData = await this.adminReportsService.getPeriodReport(period, {
            type: query.type,
            startDate: query.startDate,
            endDate: query.endDate,
        });
        const pdfBuffer = await this.pdfExportService.generatePdf(reportData, period, query.type);
        const filename = `${query.type}-${period}-${new Date().toISOString().split('T')[0]}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(pdfBuffer);
    }
    async exportExcel(query, res) {
        const period = query.period || 'daily';
        if (query.async) {
            const job = await this.reportsExportQueue.add('generate-export', {
                format: 'excel',
                period,
                type: query.type,
                startDate: query.startDate,
                endDate: query.endDate,
            });
            return res.status(202).json({
                jobId: job.id,
                status: 'QUEUED',
                message: 'Report export job queued. Download link available upon completion at GET /admin/reports/export/jobs/' +
                    job.id,
            });
        }
        const reportData = await this.adminReportsService.getPeriodReport(period, {
            type: query.type,
            startDate: query.startDate,
            endDate: query.endDate,
        });
        const excelBuffer = await this.excelExportService.generateExcel(reportData, period, query.type);
        const filename = `${query.type}-${period}-${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(excelBuffer);
    }
    async getJobStatus(id, res) {
        const job = await this.reportsExportQueue.getJob(id);
        if (!job) {
            throw new common_1.NotFoundException(`Export job with ID '${id}' not found`);
        }
        const state = await job.getState();
        const progress = job.progress();
        if (state === 'completed') {
            return res.json({
                id: job.id,
                status: 'COMPLETED',
                progress: 100,
                result: job.returnvalue,
            });
        }
        return res.json({
            id: job.id,
            status: state.toUpperCase(),
            progress,
            failedReason: job.failedReason || null,
        });
    }
};
exports.AdminReportsExportController = AdminReportsExportController;
__decorate([
    (0, common_1.Get)('pdf'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/pdf — Export daily/weekly/monthly report to PDF',
        description: 'Generates a PDF document for member registrations, repurchase activities, earnings summary, or business summary.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'PDF file binary or queue job reference',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_export_report_dto_1.QueryExportReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsExportController.prototype, "exportPdf", null);
__decorate([
    (0, common_1.Get)('excel'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/excel — Export daily/weekly/monthly report to Excel (.xlsx)',
        description: 'Generates an Excel workbook with formatted headers matching the report type and period breakdown.',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Excel .xlsx file binary or queue job reference',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_export_report_dto_1.QueryExportReportDto, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsExportController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'GET /admin/reports/export/jobs/:id — Check export queue job status or download result',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Export job status and payload' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminReportsExportController.prototype, "getJobStatus", null);
exports.AdminReportsExportController = AdminReportsExportController = __decorate([
    (0, swagger_1.ApiTags)('Admin Reports Export'),
    (0, common_1.Controller)('admin/reports/export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.MemberRole.ADMIN, client_1.MemberRole.SUB_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    __param(3, (0, bull_1.InjectQueue)('reports-export')),
    __metadata("design:paramtypes", [admin_reports_service_1.AdminReportsService,
        report_pdf_export_service_1.ReportPdfExportService,
        report_excel_export_service_1.ReportExcelExportService, Object])
], AdminReportsExportController);
//# sourceMappingURL=admin-reports-export.controller.js.map