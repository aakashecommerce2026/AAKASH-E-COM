import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
