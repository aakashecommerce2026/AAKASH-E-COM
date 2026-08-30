import { Injectable, Logger } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export const TDS_DEDUCTIONS_KEY = 'TDS_DEDUCTIONS_ENABLED';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async isTdsEnabled(): Promise<boolean> {
    try {
      const setting = await this.prisma.systemSetting.findUnique({
        where: { key: TDS_DEDUCTIONS_KEY },
      });
      if (!setting) return true; // Default to enabled if unseeded
      return setting.value === 'true';
    } catch {
      return true;
    }
  }

  async setTdsEnabled(
    enabled: boolean,
    actorId?: string,
    actorRole?: MemberRole,
  ) {
    const value = enabled ? 'true' : 'false';

    const setting = await this.prisma.systemSetting.upsert({
      where: { key: TDS_DEDUCTIONS_KEY },
      update: {
        value,
        updatedBy: actorId || null,
        description:
          'System-wide flag for TDS (5%) & Admin Fee (5%) statutory tax deductions',
      },
      create: {
        key: TDS_DEDUCTIONS_KEY,
        value,
        updatedBy: actorId || null,
        description:
          'System-wide flag for TDS (5%) & Admin Fee (5%) statutory tax deductions',
      },
    });

    await this.auditService.logAction({
      actorId: actorId || null,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: enabled ? 'ENABLE_TDS_DEDUCTIONS' : 'DISABLE_TDS_DEDUCTIONS',
      entityType: 'SystemSetting',
      entityId: setting.id,
      metadata: { enabled, value },
    });

    this.logger.log(
      `Statutory TDS deductions system setting updated: ENABLED = ${enabled}`,
    );

    return {
      enabled,
      message: enabled
        ? 'Statutory tax deductions (5% TDS + 5% Admin fee) ENABLED system-wide.'
        : 'Statutory tax deductions (5% TDS + 5% Admin fee) DISABLED system-wide.',
    };
  }
}
