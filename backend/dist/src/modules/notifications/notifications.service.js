"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const client_1 = require("@prisma/client");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    auditService;
    emailService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, auditService, emailService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.emailService = emailService;
    }
    async notifyMemberCommissionDistributed(params) {
        const { memberId, memberCode, memberName, mobile, email, batchNo, grossAmount, tdsAmount, adminFee, netAmount, paymentRef, channels = ['EMAIL', 'SMS', 'IN_APP'], } = params;
        const messageContent = `Dear ${memberName} (${memberCode}), your commission payout of ₹${netAmount.toFixed(2)} (Gross: ₹${grossAmount.toFixed(2)}, TDS: ₹${tdsAmount.toFixed(2)}, Admin Fee: ₹${adminFee.toFixed(2)}) under Batch '${batchNo}' has been processed and disbursed.`;
        if (channels.includes('IN_APP')) {
            this.logger.log(`[IN_APP NOTIFICATION] Member: ${memberCode} (${memberId}) | ${messageContent}`);
        }
        if (channels.includes('EMAIL') && email) {
            if (this.emailService) {
                try {
                    await this.emailService.sendPayoutDisbursedEmail(email, memberName, batchNo, grossAmount, tdsAmount, adminFee, netAmount, paymentRef);
                }
                catch (err) {
                    this.logger.error(`Failed to send payout email to ${email}: ${err.message}`);
                }
            }
            else {
                this.logger.log(`[EMAIL NOTIFICATION] To: ${email} | Subject: Commission Payout Disbursed - ${batchNo}`);
            }
        }
        if (channels.includes('SMS') && mobile) {
            this.logger.log(`[SMS NOTIFICATION] To: ${mobile} | Message: ${messageContent}`);
        }
        await this.auditService.logAction({
            actorId: null,
            actorRole: client_1.MemberRole.ADMIN,
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
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map