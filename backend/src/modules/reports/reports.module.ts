import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { MemberPortalReportsService } from './member-portal-reports.service';
import { AdminReportsService } from './admin-reports.service';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';
import { AdminEarningsRepurchaseController } from './admin-earnings-repurchase.controller';
import { MemberEarningsRepurchaseController } from './member-earnings-repurchase.controller';
import { MemberEarningsTotalController } from './member-earnings-total.controller';
import { MemberActivityController } from './member-activity.controller';
import { AdminReportsController } from './admin-reports.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminEarningsMembershipController,
    MemberEarningsMembershipController,
    AdminEarningsRepurchaseController,
    MemberEarningsRepurchaseController,
    MemberEarningsTotalController,
    MemberActivityController,
    AdminReportsController,
  ],
  providers: [ReportsService, MemberPortalReportsService, AdminReportsService],
  exports: [ReportsService, MemberPortalReportsService, AdminReportsService],
})
export class ReportsModule {}

