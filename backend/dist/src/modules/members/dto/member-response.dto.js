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
exports.MemberResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const bank_details_dto_1 = require("./bank-details.dto");
class MemberResponseDto {
    id;
    memberCode;
    name;
    mobile;
    email;
    address;
    referrerId;
    joiningDate;
    upiId;
    bankDetails;
    status;
    role;
    createdAt;
    updatedAt;
}
exports.MemberResponseDto = MemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AK10001' }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "memberCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@example.com' }),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123 Main Street' }),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc' }),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "referrerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "joiningDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'john@upi' }),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: bank_details_dto_1.BankDetailsDto }),
    __metadata("design:type", Object)
], MemberResponseDto.prototype, "bankDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MemberStatus }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.MemberRole }),
    __metadata("design:type", String)
], MemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MemberResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=member-response.dto.js.map