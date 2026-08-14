import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MemberProfileService } from './member-profile.service';
import { MembersController } from './members.controller';
import { AdminMembersController } from './admin-members.controller';
import { MemberProfileController } from './member-profile.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { MembershipCommissionModule } from '../membership-commission/membership-commission.module';

@Module({
  imports: [PrismaModule, AuditModule, MembershipCommissionModule],
  controllers: [MembersController, AdminMembersController, MemberProfileController],
  providers: [MembersService, MemberProfileService],
  exports: [MembersService, MemberProfileService],
})
export class MembersModule {}
