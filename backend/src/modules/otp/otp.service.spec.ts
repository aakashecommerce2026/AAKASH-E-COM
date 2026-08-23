import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OtpPurpose } from './enums/otp-purpose.enum';

describe('OtpService', () => {
  let service: OtpService;
  let prismaService: any;
  let emailService: any;

  beforeEach(async () => {
    prismaService = {
      emailOtp: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    emailService = {
      sendOtpEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OtpService,
        { provide: PrismaService, useValue: prismaService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<OtpService>(OtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOtp', () => {
    it('should generate, store hashed OTP, and dispatch email', async () => {
      prismaService.emailOtp.findFirst.mockResolvedValue(null);
      prismaService.emailOtp.create.mockResolvedValue({ id: 'otp-uuid-1' });

      const result = await service.sendOtp({
        email: 'user@example.com',
        purpose: OtpPurpose.EMAIL_VERIFICATION,
      });

      expect(result.message).toContain('OTP sent successfully');
      expect(prismaService.emailOtp.create).toHaveBeenCalled();
      expect(emailService.sendOtpEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.any(String),
        OtpPurpose.EMAIL_VERIFICATION,
      );
    });

    it('should throw BadRequestException if cooldown is active (<60 seconds)', async () => {
      prismaService.emailOtp.findFirst.mockResolvedValue({
        id: 'otp-recent',
        createdAt: new Date(), // Created just now
      });

      await expect(
        service.sendOtp({
          email: 'user@example.com',
          purpose: OtpPurpose.EMAIL_VERIFICATION,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyOtp', () => {
    it('should throw BadRequestException if no active OTP found', async () => {
      prismaService.emailOtp.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({
          email: 'user@example.com',
          otp: '123456',
          purpose: OtpPurpose.EMAIL_VERIFICATION,
        }),
      ).rejects.toThrow('Invalid or expired OTP code.');
    });
  });
});
