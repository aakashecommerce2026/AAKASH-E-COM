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
exports.CreateAdminMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const bank_details_dto_1 = require("./bank-details.dto");
class CreateAdminMemberDto {
    memberCode;
    name;
    mobile;
    email;
    address;
    referrerId;
    upiId;
    bankDetails;
    status;
    password;
    role;
    joiningFee;
}
exports.CreateAdminMemberDto = CreateAdminMemberDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'AK10001',
        description: 'Member Code (auto-generated if omitted)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "memberCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Full name of the member' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Member name is required' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', description: 'Mobile phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Mobile number is required' }),
    (0, class_validator_1.Matches)(/^\+?[0-9]{10,15}$/, {
        message: 'Mobile number must be 10 to 15 digits, optionally prefixed with +',
    }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'john@example.com',
        description: 'Email address',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Invalid email format' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '123 Main Street, City',
        description: 'Postal Address',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        description: 'Referrer Member UUID',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { message: 'Referrer ID must be a valid UUID' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "referrerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@upi', description: 'UPI ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        type: bank_details_dto_1.BankDetailsDto,
        description: 'Bank Account Details',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => bank_details_dto_1.BankDetailsDto),
    __metadata("design:type", bank_details_dto_1.BankDetailsDto)
], CreateAdminMemberDto.prototype, "bankDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberStatus, default: client_1.MemberStatus.ACTIVE }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberStatus, { message: 'Invalid member status' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'SecureP@ssw0rd!',
        description: 'Plain password (auto-generated temporary password if omitted)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Password must be at least 6 characters long' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberRole, default: client_1.MemberRole.MEMBER }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberRole, { message: 'Invalid member role' }),
    __metadata("design:type", String)
], CreateAdminMemberDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 10000,
        description: 'Joining Fee / Package Amount (defaults to 10000)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Joining fee must be a number' }),
    (0, class_validator_1.Min)(0, { message: 'Joining fee cannot be negative' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateAdminMemberDto.prototype, "joiningFee", void 0);
//# sourceMappingURL=create-admin-member.dto.js.map