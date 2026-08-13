import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RepurchaseCommissionService } from './repurchase-commission.service';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [RepurchaseCommissionService],
  exports: [RepurchaseCommissionService],
})
export class RepurchaseCommissionModule {}
