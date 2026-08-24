import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { OtpModule } from './modules/otp/otp.module';
import { PromotionsModule } from './modules/promotions/promotions.module';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [envFile, '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 30, // max 30 requests per second
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 150, // max 150 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 500, // max 500 requests per minute
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
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
    NotificationsModule,
    EmailModule,
    OtpModule,
    PromotionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
