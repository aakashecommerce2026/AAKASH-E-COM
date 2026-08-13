import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RepurchaseService } from './repurchase.service';
import { AdminRepurchaseController } from './repurchase.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminRepurchaseController],
  providers: [RepurchaseService],
  exports: [RepurchaseService],
})
export class RepurchaseModule {}
