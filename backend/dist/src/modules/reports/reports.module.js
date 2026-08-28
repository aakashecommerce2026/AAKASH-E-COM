"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_module_1 = require("../../prisma/prisma.module");
const reports_service_1 = require("./reports.service");
const member_portal_reports_service_1 = require("./member-portal-reports.service");
const admin_reports_service_1 = require("./admin-reports.service");
const pdf_export_service_1 = require("./pdf-export.service");
const excel_export_service_1 = require("./excel-export.service");
const report_export_processor_1 = require("./report-export.processor");
const report_pdf_export_service_1 = require("./export/report-pdf-export.service");
const report_excel_export_service_1 = require("./export/report-excel-export.service");
const report_export_queue_processor_1 = require("./export/report-export-queue.processor");
const admin_earnings_membership_controller_1 = require("./admin-earnings-membership.controller");
const member_earnings_membership_controller_1 = require("./member-earnings-membership.controller");
const admin_earnings_repurchase_controller_1 = require("./admin-earnings-repurchase.controller");
const member_earnings_repurchase_controller_1 = require("./member-earnings-repurchase.controller");
const member_earnings_total_controller_1 = require("./member-earnings-total.controller");
const member_activity_controller_1 = require("./member-activity.controller");
const admin_reports_controller_1 = require("./admin-reports.controller");
const admin_reports_export_controller_1 = require("./admin-reports-export.controller");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            bull_1.BullModule.registerQueue({ name: 'reports-export' }, { name: 'report-export-queue' }),
        ],
        controllers: [
            admin_earnings_membership_controller_1.AdminEarningsMembershipController,
            member_earnings_membership_controller_1.MemberEarningsMembershipController,
            admin_earnings_repurchase_controller_1.AdminEarningsRepurchaseController,
            member_earnings_repurchase_controller_1.MemberEarningsRepurchaseController,
            member_earnings_total_controller_1.MemberEarningsTotalController,
            member_activity_controller_1.MemberActivityController,
            admin_reports_controller_1.AdminReportsController,
            admin_reports_export_controller_1.AdminReportsExportController,
        ],
        providers: [
            reports_service_1.ReportsService,
            member_portal_reports_service_1.MemberPortalReportsService,
            admin_reports_service_1.AdminReportsService,
            pdf_export_service_1.PdfExportService,
            excel_export_service_1.ExcelExportService,
            report_export_processor_1.ReportExportProcessor,
            report_pdf_export_service_1.ReportPdfExportService,
            report_excel_export_service_1.ReportExcelExportService,
            report_export_queue_processor_1.ReportExportProcessor,
        ],
        exports: [
            reports_service_1.ReportsService,
            member_portal_reports_service_1.MemberPortalReportsService,
            admin_reports_service_1.AdminReportsService,
            pdf_export_service_1.PdfExportService,
            excel_export_service_1.ExcelExportService,
            report_pdf_export_service_1.ReportPdfExportService,
            report_excel_export_service_1.ReportExcelExportService,
        ],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map