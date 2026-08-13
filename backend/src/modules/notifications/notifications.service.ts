import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MemberRole } from '@prisma/client';

export interface NotifyDistributionParams {
  memberId: string;
  memberCode: string;
  memberName: string;
  mobile?: string | null;
  email?: string | null;
  batchNo: string;
  grossAmount: number;
  tdsAmount: number;
  adminFee: number;
  netAmount: number;
  channels?: ('EMAIL' | 'SMS' | 'IN_APP')[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Per-member notification hook triggered when commission payout is marked as DISBURSED.
   * Dispatches notifications via configured channels (EMAIL, SMS, IN_APP placeholders).
   */
  async notifyMemberCommissionDistributed(params: NotifyDistributionParams): Promise<void> {
    const {
      memberId,
      memberCode,
      memberName,
      mobile,
      email,
      batchNo,
      grossAmount,
      tdsAmount,
      adminFee,
      netAmount,
      channels = ['EMAIL', 'SMS', 'IN_APP'],
    } = params;

    const messageContent = `Dear ${memberName} (${memberCode}), your commission payout of ₹${netAmount.toFixed(
      2,
    )} (Gross: ₹${grossAmount.toFixed(2)}, TDS: ₹${tdsAmount.toFixed(2)}, Admin Fee: ₹${adminFee.toFixed(
      2,
    )}) under Batch '${batchNo}' has been processed and disbursed.`;

    // 1. In-App Notification Hook Placeholder
    if (channels.includes('IN_APP')) {
      this.logger.log(`[IN_APP NOTIFICATION] Member: ${memberCode} (${memberId}) | ${messageContent}`);
    }

    // 2. Email Notification Hook Placeholder
    if (channels.includes('EMAIL') && email) {
      this.logger.log(`[EMAIL NOTIFICATION] To: ${email} | Subject: Commission Payout Disbursed - ${batchNo} | Body: ${messageContent}`);
    }

    // 3. SMS Notification Hook Placeholder
    if (channels.includes('SMS') && mobile) {
      this.logger.log(`[SMS NOTIFICATION] To: ${mobile} | Message: ${messageContent}`);
    }

    // 4. Log NOTIFY_DISTRIBUTION_MEMBER action to activity_logs
    await this.auditService.logAction({
      actorId: null,
      actorRole: MemberRole.ADMIN,
      actionType: 'NOTIFY_DISTRIBUTION_MEMBER',
      entityType: 'Member',
      entityId: memberId,
      metadata: {
        memberCode,
        batchNo,
        grossAmount,
        tdsAmount,
        adminFee,
        netAmount,
        channels,
      },
    });
  }
}
