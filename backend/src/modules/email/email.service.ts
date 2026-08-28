import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: any = null;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = parseInt(
      this.configService.get<string>('SMTP_PORT') || '587',
      10,
    );
    const user = this.configService.get<string>('SMTP_USER');
    const rawPass = this.configService.get<string>('SMTP_PASS') || '';
    const pass = rawPass.replace(/\s+/g, '');
    const service = this.configService.get<string>('SMTP_SERVICE'); // e.g. 'gmail'
    const secure = this.configService.get<string>('SMTP_SECURE') === 'true';
    const rawFromName =
      this.configService.get<string>('EMAIL_FROM_NAME') ||
      'AAKASH E-COM Notifications';
    const rawFromEmail =
      this.configService.get<string>('EMAIL_FROM_ADDRESS') ||
      user ||
      'noreply@aakashecom.com';

    const cleanFromName = rawFromName.replace(/^["']|["']$/g, '');
    const cleanFromEmail = rawFromEmail.replace(/^["']|["']$/g, '');

    this.fromAddress = `"${cleanFromName}" <${cleanFromEmail}>`;

    if ((host || service) && user && pass) {
      try {
        const nodemailer = require('nodemailer');
        const transportConfig: any = {
          auth: { user, pass },
        };

        if (service) {
          transportConfig.service = service;
        } else {
          transportConfig.host = host;
          transportConfig.port = port;
          transportConfig.secure = secure;
        }

        this.transporter = nodemailer.createTransport(transportConfig);
        this.logger.log(`Initialized SMTP transport via ${service || host}`);
      } catch (err: any) {
        this.logger.warn(
          `Failed to initialize Nodemailer transport: ${err.message}. Running in DEV simulation mode.`,
        );
      }
    } else {
      this.logger.warn(
        'SMTP credentials not configured (Set SMTP_USER & SMTP_PASS in .env for live email sending). EmailService running in DEV mode.',
      );
    }
  }

  /**
   * General-purpose async email dispatch
   */
  async sendMail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (!this.transporter) {
      this.logger.log(`
==================================================
📧 [DEV EMAIL DISPATCH SIMULATION]
To:      ${to}
Subject: ${subject}
--------------------------------------------------
${text || html}
==================================================
`);
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ''),
      });
      this.logger.log(
        `Email dispatched successfully to ${to} (MessageId: ${info.messageId})`,
      );
      const nodemailer = require('nodemailer');
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        this.logger.log(`🔗 Ethereal Live Email Preview URL: ${previewUrl}`);
      }
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send live email to ${to}: ${error.message}`);

      // In Development mode, if live email dispatch fails (e.g. Resend unverified domain restriction),
      // gracefully fall back to printing the email & OTP in console so development is not blocked.
      const isDev = this.configService.get<string>('NODE_ENV') !== 'production';
      if (isDev) {
        this.logger.warn(
          `⚠️ [DEV FALLBACK] Live SMTP send failed. Falling back to console preview so testing is not blocked:`,
        );
        this.logger.log(`
==================================================
📧 [DEV EMAIL DISPATCH SIMULATION]
To:      ${to}
Subject: ${subject}
--------------------------------------------------
${text || html}
==================================================
`);
        return true;
      }

      return false;
    }
  }

  /**
   * Sends 6-Digit OTP Email
   */
  async sendOtpEmail(
    email: string,
    otp: string,
    purpose: string,
  ): Promise<boolean> {
    const formattedPurpose = purpose.replace(/_/g, ' ').toLowerCase();
    const subject = `AAKASH E-COM - Account Verification Code`;

    const text = `AAKASH E-COM\nAccount Verification Code\n\nYour 6-digit OTP verification code for ${formattedPurpose} is: ${otp}\n\nThis code will expire in 10 minutes. Do not share this code with anyone.\n\n© ${new Date().getFullYear()} AAKASH E-COM. All rights reserved.`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #064e3b;">
          <h2 style="color: #064e3b; margin: 0; font-size: 24px;">AAKASH E-COM</h2>
          <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px;">Multi-Level Marketing Portal</p>
        </div>
        
        <div style="padding: 30px 10px; text-align: center;">
          <h3 style="color: #333333; margin-top: 0;">Email Verification Required</h3>
          <p style="color: #555555; font-size: 15px; line-height: 1.5;">
            You requested an OTP verification for <strong>${formattedPurpose}</strong>. Please use the 6-digit code below to complete your action.
          </p>
          
          <div style="margin: 30px 0; background-color: #f0fdf4; border: 2px dashed #059669; border-radius: 8px; padding: 20px; display: inline-block;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #064e3b;">${otp}</span>
          </div>
          
          <p style="color: #888888; font-size: 13px; margin-bottom: 0;">
            ⏳ This OTP code will expire in <strong>10 minutes</strong>. Do not share this OTP code with anyone.
          </p>
        </div>
        
        <div style="border-top: 1px solid #eeeeee; padding-top: 15px; text-align: center; color: #999999; font-size: 12px;">
          <p style="margin: 0;">If you did not request this OTP, please ignore this email or contact support.</p>
          <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} AAKASH E-COM. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html, text });
  }

  /**
   * Sends Welcome Email upon member registration
   */
  async sendWelcomeEmail(
    email: string,
    name: string,
    memberCode: string,
  ): Promise<boolean> {
    const subject = `Welcome to AAKASH E-COM, ${name}! Your Member Code is ${memberCode}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="background-color: #064e3b; color: white; padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 26px;">Welcome aboard, ${name}!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your registration at AAKASH E-COM is complete.</p>
        </div>
        <div style="padding: 25px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333333;">Dear <strong>${name}</strong>,</p>
          <p style="color: #555555; line-height: 1.6;">
            We are excited to have you join our Unilevel MLM network platform. Here are your account credentials:
          </p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 5px 0; color: #334155;"><strong>Member Code:</strong> <span style="color: #059669; font-size: 18px; font-weight: bold;">${memberCode}</span></p>
            <p style="margin: 5px 0; color: #334155;"><strong>Registered Email:</strong> ${email}</p>
          </div>
          
          <p style="color: #555555; line-height: 1.6;">
            You can now log in to your Member Portal to track your commissions, build your downline tree, and monitor your earnings.
          </p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding: 15px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} AAKASH E-COM Platform. All rights reserved.
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }

  /**
   * Sends Commission Earned notification email
   */
  async sendCommissionEarnedEmail(
    email: string,
    name: string,
    amount: number,
    commissionType: string,
    level: number,
    sourceMemberName: string,
  ): Promise<boolean> {
    const subject = `🎉 Commission Earned: ₹${amount.toFixed(2)} from Level ${level}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="background-color: #047857; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Commission Credit Alert!</h2>
        </div>
        <div style="padding: 25px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333333;">Hello <strong>${name}</strong>,</p>
          <p style="color: #555555;">You have earned a new commission from your downline activity:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Amount Earned</strong></td>
              <td style="padding: 10px; border: 1px solid #cbd5e1; color: #059669; font-weight: bold; font-size: 18px;">₹${amount.toFixed(
                2,
              )}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Commission Type</strong></td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${commissionType}</td>
            </tr>
            <tr style="background-color: #f1f5f9;">
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Downline Level</strong></td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">Level ${level}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><strong>Source Member</strong></td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${sourceMemberName}</td>
            </tr>
          </table>
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }

  /**
   * Sends Payout Disbursed statement email
   */
  async sendPayoutDisbursedEmail(
    email: string,
    name: string,
    batchNo: string,
    grossAmount: number,
    tdsAmount: number,
    adminFee: number,
    netAmount: number,
    paymentRef?: string,
  ): Promise<boolean> {
    const subject = `Payout Disbursed: ₹${netAmount.toFixed(2)} (Batch ${batchNo}) - AAKASH E-COM`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="background-color: #022c22; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Commission Payout Statement</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.8; font-size: 14px;">Batch Ref: ${batchNo}</p>
        </div>
        <div style="padding: 25px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #333333;">Dear <strong>${name}</strong>,</p>
          <p style="color: #555555;">Your commission payout under Batch <strong>${batchNo}</strong> has been successfully processed and disbursed.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Gross Commission</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">₹${grossAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Less: TDS Deduction (5%)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #dc2626;">-₹${tdsAmount.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Less: Admin Charge (5%)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: #dc2626;">-₹${adminFee.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #ecfdf5; font-weight: bold; font-size: 16px;">
              <td style="padding: 12px; border: 1px solid #a7f3d0; color: #065f46;">Net Disbursed Amount</td>
              <td style="padding: 12px; border: 1px solid #a7f3d0; text-align: right; color: #059669;">₹${netAmount.toFixed(2)}</td>
            </tr>
          </table>

          ${
            paymentRef
              ? `<p style="color: #475569; font-size: 14px;"><strong>Payment Reference / UTR:</strong> ${paymentRef}</p>`
              : ''
          }
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }

  /**
   * Sends Security Alert email
   */
  async sendSecurityAlertEmail(
    email: string,
    name: string,
    actionDescription: string,
    ipAddress?: string,
  ): Promise<boolean> {
    const subject = `Security Notification: ${actionDescription} - AAKASH E-COM`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="background-color: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Security Alert</h2>
        </div>
        <div style="padding: 25px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>This is a security alert regarding your AAKASH E-COM account.</p>
          <p style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; font-weight: bold; color: #991b1b;">
            Action: ${actionDescription}
          </p>
          ${ipAddress ? `<p style="font-size: 13px; color: #666666;">IP Location: ${ipAddress}</p>` : ''}
          <p style="font-size: 13px; color: #888888;">If you performed this action, no further steps are required. If you did not authorize this, please contact support immediately.</p>
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }

  /**
   * Sends Password Reset email with direct reset link
   */
  async sendPasswordResetLinkEmail(
    email: string,
    name: string,
    resetLink: string,
    token: string,
  ): Promise<boolean> {
    const subject = `Reset Your Password - AAKASH E-COM`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <div style="background-color: #064e3b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Password Reset Request</h2>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 16px; color: #333333;">Hello <strong>${name}</strong>,</p>
          <p style="color: #555555; line-height: 1.5;">
            We received a request to reset the password for your AAKASH E-COM account. Click the button below to reset your password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p style="color: #555555; font-size: 14px;">
            Or copy and paste this reset URL into your browser:<br/>
            <a href="${resetLink}" style="color: #059669; word-break: break-all;">${resetLink}</a>
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #334155; font-size: 14px;">
              Reset Code / Token: <strong style="color: #0369a1; font-size: 16px; letter-spacing: 2px;">${token}</strong>
            </p>
          </div>

          <p style="color: #888888; font-size: 13px;">
            ⏳ This reset link will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email.
          </p>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding: 15px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} AAKASH E-COM. All rights reserved.
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }

  /**
   * Sends Account Deletion notification email to member
   */
  async sendAccountDeletionEmail(
    email: string,
    name: string,
    memberCode: string,
  ): Promise<boolean> {
    const subject = `Account Termination Notice - AAKASH E-COM (${memberCode})`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
        <div style="background-color: #991b1b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Account Termination Notice</h2>
        </div>
        <div style="padding: 25px;">
          <p style="font-size: 16px; color: #333333;">Dear <strong>${name}</strong> (${memberCode}),</p>
          <p style="color: #555555; line-height: 1.5;">
            This email is to notify you that your AAKASH E-COM member account (Member Code: <strong>${memberCode}</strong>) has been deleted by system administration.
          </p>
          <p style="color: #555555; line-height: 1.5;">
            Your active referral downline network has been safely migrated to the Super Admin network root to maintain system continuity.
          </p>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 13px;">
              If you believe this account deletion was performed in error, please contact customer support immediately.
            </p>
          </div>
        </div>
        <div style="border-top: 1px solid #eeeeee; padding: 15px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} AAKASH E-COM. All rights reserved.
        </div>
      </div>
    `;

    return this.sendMail({ to: email, subject, html });
  }
}
