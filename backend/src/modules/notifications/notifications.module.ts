import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
