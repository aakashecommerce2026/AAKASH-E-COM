import { Module } from '@nestjs/common';
import { MembershipCommissionService } from './membership-commission.service';
import { MembershipCommissionController } from './membership-commission.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MembershipCommissionController],
  providers: [MembershipCommissionService],
  exports: [MembershipCommissionService],
})
export class MembershipCommissionModule {}
