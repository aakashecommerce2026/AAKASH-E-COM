import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RepurchaseCommissionModule } from '../repurchase-commission/repurchase-commission.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { RepurchaseService } from './repurchase.service';
import { AdminRepurchaseController } from './repurchase.controller';
import { MemberRepurchaseController } from './member-repurchase.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    RepurchaseCommissionModule,
    DashboardModule,
  ],
  controllers: [AdminRepurchaseController, MemberRepurchaseController],
  providers: [RepurchaseService],
  exports: [RepurchaseService],
})
export class RepurchaseModule {}
