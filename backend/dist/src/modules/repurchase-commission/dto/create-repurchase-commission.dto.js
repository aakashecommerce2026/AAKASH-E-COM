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
exports.CreateRepurchaseCommissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateRepurchaseCommissionDto {
    repurchaseEntryId;
    sourceMemberId;
    beneficiaryMemberId;
    level;
    percentage;
    amount;
    status;
}
exports.CreateRepurchaseCommissionDto = CreateRepurchaseCommissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5',
        description: 'Repurchase Entry UUID',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepurchaseCommissionDto.prototype, "repurchaseEntryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        description: 'Source Member UUID (who made repurchase)',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepurchaseCommissionDto.prototype, "sourceMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'b2c3d4e5-f6a7-8901-bcde-2345678901bc',
        description: 'Beneficiary Member UUID (upline who earns)',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepurchaseCommissionDto.prototype, "beneficiaryMemberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Commission Downline Level (1, 2, 3...)',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateRepurchaseCommissionDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5.0, description: 'Commission Percentage Rate' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRepurchaseCommissionDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 75.25, description: 'Earned Commission Amount' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRepurchaseCommissionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.CommissionStatus,
        default: client_1.CommissionStatus.PENDING,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CommissionStatus),
    __metadata("design:type", String)
], CreateRepurchaseCommissionDto.prototype, "status", void 0);
//# sourceMappingURL=create-repurchase-commission.dto.js.map