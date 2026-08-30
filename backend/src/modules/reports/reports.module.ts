import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { AdminReportsService } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { ReportExportProcessor } from './report-export.processor';
import { ReportPdfExportService } from './export/report-pdf-export.service';
import { ReportExcelExportService } from './export/report-excel-export.service';
import { ReportExportProcessor as ReportExportQueueProcessor } from './export/report-export-queue.processor';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { AdminEarningsRepurchaseController } from './admin-earnings-repurchase.controller';
import { MemberEarningsRepurchaseController } from './member-earnings-repurchase.controller';
import { MemberEarningsTotalController } from './member-earnings-total.controller';
import { MemberActivityController } from './member-activity.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsExportController } from './admin-reports-export.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'reports-export' },
      { name: 'report-export-queue' },
    ),
  ],
  controllers: [
    AdminEarningsMembershipController,
    MemberEarningsMembershipController,
    AdminEarningsRepurchaseController,
    MemberEarningsRepurchaseController,
    MemberEarningsTotalController,
    MemberActivityController,
    AdminReportsController,
    AdminReportsExportController,
  ],
  providers: [
    ReportsService,
    MemberPortalReportsService,
    AdminReportsService,
    PdfExportService,
    ExcelExportService,
    ReportExportProcessor,
    ReportPdfExportService,
    ReportExcelExportService,
    ReportExportQueueProcessor,
  ],
  exports: [
    ReportsService,
    MemberPortalReportsService,
    AdminReportsService,
    PdfExportService,
    ExcelExportService,
    ReportPdfExportService,
    ReportExcelExportService,
  ],
})
export class ReportsModule {}
