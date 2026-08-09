import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { AdminMembersController } from './admin-members.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [MembersController, AdminMembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
