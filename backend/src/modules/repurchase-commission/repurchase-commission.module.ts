import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RepurchaseCommissionService } from './repurchase-commission.service';
import { RepurchaseCommissionController } from './repurchase-commission.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RepurchaseCommissionController],
  providers: [RepurchaseCommissionService],
  exports: [RepurchaseCommissionService],
})
export class RepurchaseCommissionModule {}

