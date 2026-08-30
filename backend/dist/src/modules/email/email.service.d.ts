import { ConfigService } from '@nestjs/config';
export interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private transporter;
    private readonly fromAddress;
    constructor(configService: ConfigService);
    sendMail(options: SendMailOptions): Promise<boolean>;
    sendOtpEmail(email: string, otp: string, purpose: string): Promise<boolean>;
    sendWelcomeEmail(email: string, name: string, memberCode: string): Promise<boolean>;
    sendCommissionEarnedEmail(email: string, name: string, amount: number, commissionType: string, level: number, sourceMemberName: string): Promise<boolean>;
    sendPayoutDisbursedEmail(email: string, name: string, batchNo: string, grossAmount: number, tdsAmount: number, adminFee: number, netAmount: number, paymentRef?: string): Promise<boolean>;
    sendSecurityAlertEmail(email: string, name: string, actionDescription: string, ipAddress?: string): Promise<boolean>;
    sendPasswordResetLinkEmail(email: string, name: string, resetLink: string, token?: string): Promise<boolean>;
    sendAccountDeletionEmail(email: string, name: string, memberCode: string): Promise<boolean>;
}
