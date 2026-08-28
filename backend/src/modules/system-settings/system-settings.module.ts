import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { SystemSettingsService } from './system-settings.service';
import { SystemSettingsController } from './system-settings.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
