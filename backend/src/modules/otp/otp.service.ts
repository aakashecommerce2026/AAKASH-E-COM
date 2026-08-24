import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly COOLDOWN_SECONDS = 60;
  private readonly EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generates a 6-digit OTP, stores bcrypt hash in DB, and dispatches email
   */
  async sendOtp(
    dto: SendOtpDto,
  ): Promise<{ message: string; cooldownSeconds: number; rawOtp?: string }> {
    const { email, purpose } = dto;
    const normalizedEmail = email.trim().toLowerCase();

    // Check rate-limiting / cooldown
    const lastOtp = await this.prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const secondsSinceLast = Math.floor(
        (Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000,
      );

      if (secondsSinceLast < this.COOLDOWN_SECONDS) {
        const remainingCooldown = this.COOLDOWN_SECONDS - secondsSinceLast;
        throw new BadRequestException(
          `Please wait ${remainingCooldown} seconds before requesting another OTP code.`,
        );
      }
    }

    // Generate 6-digit random numeric OTP string
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);

    // Save EmailOtp record
    await this.prisma.emailOtp.create({
      data: {
        email: normalizedEmail,
        otpHash,
        purpose,
        expiresAt,
      },
    });

    // Send email asynchronously
    await this.emailService.sendOtpEmail(normalizedEmail, rawOtp, purpose);

    this.logger.log(
      `Generated and dispatched OTP for ${normalizedEmail} (${purpose})`,
    );

    return {
      message: `OTP sent successfully to ${normalizedEmail}`,
      cooldownSeconds: this.COOLDOWN_SECONDS,
      rawOtp,
    };
  }

  /**
   * Validates a 6-digit OTP against stored bcrypt hash
   */
  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ verified: boolean; message: string }> {
    const { email, otp, purpose } = dto;
    const normalizedEmail = email.trim().toLowerCase();

    // Find latest active, unexpired, non-used OTP for email and purpose
    const activeOtpRecord = await this.prisma.emailOtp.findFirst({
      where: {
        email: normalizedEmail,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtpRecord) {
      throw new BadRequestException(
        'Invalid or expired OTP code. Please request a new code.',
      );
    }

    if (activeOtpRecord.attempts >= this.MAX_ATTEMPTS) {
      // Mark as used/invalidated due to excessive attempts
      await this.prisma.emailOtp.update({
        where: { id: activeOtpRecord.id },
        data: { isUsed: true },
      });

      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new OTP code.',
      );
    }

    const isMatch = await bcrypt.compare(otp, activeOtpRecord.otpHash);

    if (!isMatch) {
      await this.prisma.emailOtp.update({
        where: { id: activeOtpRecord.id },
        data: { attempts: { increment: 1 } },
      });

      const remainingAttempts =
        this.MAX_ATTEMPTS - (activeOtpRecord.attempts + 1);
      throw new BadRequestException(
        `Incorrect OTP code. ${remainingAttempts} attempt(s) remaining.`,
      );
    }

    // Mark OTP as used
    await this.prisma.emailOtp.update({
      where: { id: activeOtpRecord.id },
      data: { isUsed: true },
    });

    this.logger.log(
      `Successfully verified OTP for ${normalizedEmail} (${purpose})`,
    );

    return {
      verified: true,
      message: 'OTP code verified successfully',
    };
  }
}
