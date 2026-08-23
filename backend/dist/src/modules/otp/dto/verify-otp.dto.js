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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyOtpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const otp_purpose_enum_1 = require("../enums/otp-purpose.enum");
class VerifyOtpDto {
    email;
    otp;
    purpose;
}
exports.VerifyOtpDto = VerifyOtpDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'user@example.com',
        description: 'Target email address for OTP verification',
    }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '123456',
        description: '6-digit numeric OTP code',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Length)(6, 6, { message: 'OTP must be exactly 6 digits' }),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: otp_purpose_enum_1.OtpPurpose,
        example: otp_purpose_enum_1.OtpPurpose.EMAIL_VERIFICATION,
        description: 'Purpose of OTP code verification',
    }),
    (0, class_validator_1.IsEnum)(otp_purpose_enum_1.OtpPurpose),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], VerifyOtpDto.prototype, "purpose", void 0);
//# sourceMappingURL=verify-otp.dto.js.map