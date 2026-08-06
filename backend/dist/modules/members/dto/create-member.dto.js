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
exports.CreateMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
const bank_details_dto_1 = require("./bank-details.dto");
class CreateMemberDto {
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
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AK10001', description: 'Unique Member Code' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "memberCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe', description: 'Full name of the member' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210', description: 'Mobile phone number' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@example.com', description: 'Email address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Main Street, City', description: 'Postal Address' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab', description: 'Referrer Member UUID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "referrerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@upi', description: 'UPI ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: bank_details_dto_1.BankDetailsDto, description: 'Bank Account Details' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => bank_details_dto_1.BankDetailsDto),
    __metadata("design:type", bank_details_dto_1.BankDetailsDto)
], CreateMemberDto.prototype, "bankDetails", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberStatus, default: client_1.MemberStatus.ACTIVE }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberStatus),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecureP@ssw0rd!', description: 'Plain password to hash' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.MemberRole, default: client_1.MemberRole.MEMBER }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.MemberRole),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "role", void 0);
//# sourceMappingURL=create-member.dto.js.map