import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { HierarchyModule } from './modules/hierarchy/hierarchy.module';
import { MembershipCommissionModule } from './modules/membership-commission/membership-commission.module';
import { RepurchaseModule } from './modules/repurchase/repurchase.module';
import { RepurchaseCommissionModule } from './modules/repurchase-commission/repurchase-commission.module';
import { DistributionModule } from './modules/distribution/distribution.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';

const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [envFile, '.env'],
    }),
    PrismaModule,
    AuthModule,
    MembersModule,
    HierarchyModule,
    MembershipCommissionModule,
    RepurchaseModule,
    RepurchaseCommissionModule,
    DistributionModule,
    ReportsModule,
    DashboardModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
