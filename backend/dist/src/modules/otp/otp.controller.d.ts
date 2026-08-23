import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
export declare class OtpController {
    private readonly otpService;
    constructor(otpService: OtpService);
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
