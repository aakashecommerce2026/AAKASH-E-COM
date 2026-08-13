import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ReportsService } from './reports.service';
import { AdminEarningsMembershipController } from './admin-earnings-membership.controller';
import { MemberEarningsMembershipController } from './member-earnings-membership.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminEarningsMembershipController, MemberEarningsMembershipController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
