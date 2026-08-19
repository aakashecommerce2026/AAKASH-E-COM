import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { AdminReportsService } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { ReportExportProcessor } from './report-export.processor';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { AdminEarningsRepurchaseController } from './admin-earnings-repurchase.controller';
import { MemberEarningsRepurchaseController } from './member-earnings-repurchase.controller';
import { MemberEarningsTotalController } from './member-earnings-total.controller';
import { MemberActivityController } from './member-activity.controller';
import { AdminReportsController } from './admin-reports.controller';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'report-export-queue',
    }),
  ],
  controllers: [
    AdminEarningsMembershipController,
    MemberEarningsMembershipController,
    AdminEarningsRepurchaseController,
    MemberEarningsRepurchaseController,
    MemberEarningsTotalController,
    MemberActivityController,
    AdminReportsController,
  ],
  providers: [
    ReportsService,
    MemberPortalReportsService,
    AdminReportsService,
    PdfExportService,
    ExcelExportService,
    ReportExportProcessor,
  ],
  exports: [
    ReportsService,
    MemberPortalReportsService,
    AdminReportsService,
    PdfExportService,
    ExcelExportService,
  ],
})
export class ReportsModule {}
