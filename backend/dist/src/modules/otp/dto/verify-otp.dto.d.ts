import { OtpPurpose } from '../enums/otp-purpose.enum';
export declare class VerifyOtpDto {
    email: string;
    otp: string;
    purpose: OtpPurpose;
}
