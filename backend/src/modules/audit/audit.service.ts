import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, Prisma } from '@prisma/client';

export interface LogActionParams {
  actorId?: string | null;
  actorRole?: MemberRole | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes an audit entry into activity_logs table.
   */
  async logAction(params: LogActionParams, txClient?: Prisma.TransactionClient) {
    const db: any = txClient || this.prisma;
    try {
      const log = await db.activityLog.create({
        data: {
          actorId: params.actorId || null,
          actorRole: params.actorRole || null,
          actionType: params.actionType,
          entityType: params.entityType,
          entityId: params.entityId || null,
          metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
        },
      });

      this.logger.log(
        `[AUDIT LOG] ${params.actionType} on ${params.entityType}:${params.entityId || 'N/A'} by ${params.actorId || 'SYSTEM'} (${params.actorRole || 'N/A'})`,
      );

      return log;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to write activity log: ${message}`);
    }
  }
}
