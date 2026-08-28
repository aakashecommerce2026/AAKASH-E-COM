import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { DistributionService } from './distribution.service';
import { AdminDistributionController } from './admin-distribution.controller';
import { DistributionProcessor } from './distribution.processor';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    NotificationsModule,
    SystemSettingsModule,
    BullModule.registerQueue({
      name: 'distribution-queue',
    }),
  ],
  controllers: [AdminDistributionController],
  providers: [DistributionService, DistributionProcessor],
  exports: [DistributionService],
})
export class DistributionModule {}
