import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DashboardController } from './dashboard.controller';
import { MemberDashboardController } from './member-dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardCacheService } from './dashboard-cache.service';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [DashboardController, MemberDashboardController],
  providers: [DashboardService, DashboardCacheService],
  exports: [DashboardService, DashboardCacheService],
})
export class DashboardModule {}
