"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let OtpService = OtpService_1 = class OtpService {
    prisma;
    emailService;
    logger = new common_1.Logger(OtpService_1.name);
    COOLDOWN_SECONDS = 60;
    EXPIRY_MINUTES = 10;
    MAX_ATTEMPTS = 3;
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async sendOtp(dto) {
        const { email, purpose } = dto;
        const normalizedEmail = email.trim().toLowerCase();
        const lastOtp = await this.prisma.emailOtp.findFirst({
            where: {
                email: normalizedEmail,
                purpose,
                isUsed: false,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (lastOtp) {
            const secondsSinceLast = Math.floor((Date.now() - new Date(lastOtp.createdAt).getTime()) / 1000);
            if (secondsSinceLast < this.COOLDOWN_SECONDS) {
                const remainingCooldown = this.COOLDOWN_SECONDS - secondsSinceLast;
                throw new common_1.BadRequestException(`Please wait ${remainingCooldown} seconds before requesting another OTP code.`);
            }
        }
        const rawOtp = crypto.randomInt(100000, 999999).toString();
        const otpHash = await bcrypt.hash(rawOtp, 10);
        const expiresAt = new Date(Date.now() + this.EXPIRY_MINUTES * 60 * 1000);
        await this.prisma.emailOtp.create({
            data: {
                email: normalizedEmail,
                otpHash,
                purpose,
                expiresAt,
            },
        });
        await this.emailService.sendOtpEmail(normalizedEmail, rawOtp, purpose);
        this.logger.log(`Generated and dispatched OTP for ${normalizedEmail} (${purpose})`);
        return {
            message: `OTP sent successfully to ${normalizedEmail}`,
            cooldownSeconds: this.COOLDOWN_SECONDS,
            rawOtp,
        };
    }
    async verifyOtp(dto) {
        const { email, otp, purpose } = dto;
        const normalizedEmail = email.trim().toLowerCase();
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
            throw new common_1.BadRequestException('Invalid or expired OTP code. Please request a new code.');
        }
        if (activeOtpRecord.attempts >= this.MAX_ATTEMPTS) {
            await this.prisma.emailOtp.update({
                where: { id: activeOtpRecord.id },
                data: { isUsed: true },
            });
            throw new common_1.BadRequestException('Maximum verification attempts exceeded. Please request a new OTP code.');
        }
        const isMatch = await bcrypt.compare(otp, activeOtpRecord.otpHash);
        if (!isMatch) {
            await this.prisma.emailOtp.update({
                where: { id: activeOtpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            const remainingAttempts = this.MAX_ATTEMPTS - (activeOtpRecord.attempts + 1);
            throw new common_1.BadRequestException(`Incorrect OTP code. ${remainingAttempts} attempt(s) remaining.`);
        }
        await this.prisma.emailOtp.update({
            where: { id: activeOtpRecord.id },
            data: { isUsed: true },
        });
        this.logger.log(`Successfully verified OTP for ${normalizedEmail} (${purpose})`);
        return {
            verified: true,
            message: 'OTP code verified successfully',
        };
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], OtpService);
//# sourceMappingURL=otp.service.js.map