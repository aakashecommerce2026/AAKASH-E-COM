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
exports.RepurchaseCommissionResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class RepurchaseCommissionResponseDto {
    id;
    repurchaseEntryId;
    sourceMemberId;
    beneficiaryMemberId;
    level;
    percentage;
    amount;
    status;
    createdAt;
    updatedAt;
}
exports.RepurchaseCommissionResponseDto = RepurchaseCommissionResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' }),
    __metadata("design:type", String)
], RepurchaseCommissionResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'c1d2e3f4-a5b6-7890-bcde-1234567890ab' }),
    __metadata("design:type", String)
], RepurchaseCommissionResponseDto.prototype, "repurchaseEntryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' }),
    __metadata("design:type", String)
], RepurchaseCommissionResponseDto.prototype, "sourceMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc' }),
    __metadata("design:type", String)
], RepurchaseCommissionResponseDto.prototype, "beneficiaryMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], RepurchaseCommissionResponseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5.0 }),
    __metadata("design:type", Object)
], RepurchaseCommissionResponseDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 75.25 }),
    __metadata("design:type", Object)
], RepurchaseCommissionResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.CommissionStatus }),
    __metadata("design:type", String)
], RepurchaseCommissionResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], RepurchaseCommissionResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], RepurchaseCommissionResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=repurchase-commission-response.dto.js.map