import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class OtpService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    private readonly COOLDOWN_SECONDS;
    private readonly EXPIRY_MINUTES;
    private readonly MAX_ATTEMPTS;
    constructor(prisma: PrismaService, emailService: EmailService);
    sendOtp(dto: SendOtpDto): Promise<{
        message: string;
        cooldownSeconds: number;
        rawOtp?: string;
    }>;
    verifyOtp(dto: VerifyOtpDto): Promise<{
        verified: boolean;
        message: string;
    }>;
}
