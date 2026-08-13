import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AdminMembersController } from './admin-members.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MembershipCommissionModule } from '../membership-commission/membership-commission.module';

@Module({
  imports: [PrismaModule, AuditModule, MembershipCommissionModule],
  controllers: [MembersController, AdminMembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
