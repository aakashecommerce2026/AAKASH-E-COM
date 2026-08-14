import { Module } from '@nestjs/common';
import { HierarchyService } from './hierarchy.service';
import { HierarchyController } from './hierarchy.controller';
import { MemberNetworkController } from './member-network.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HierarchyController, MemberNetworkController],
  providers: [HierarchyService],
  exports: [HierarchyService],
})
export class HierarchyModule {}
