import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RepurchaseService } from './repurchase.service';
import { RepurchaseController } from './repurchase.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [RepurchaseController],
  providers: [RepurchaseService],
  exports: [RepurchaseService],
})
export class RepurchaseModule {}
