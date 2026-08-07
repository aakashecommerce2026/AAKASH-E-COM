import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connected successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `⚠️ Database Connection Warning: Could not connect to PostgreSQL database on startup (${message}).`,
      );
      console.error(
        '👉 Please ensure PostgreSQL is running and your DATABASE_URL in backend/.env is correct.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
