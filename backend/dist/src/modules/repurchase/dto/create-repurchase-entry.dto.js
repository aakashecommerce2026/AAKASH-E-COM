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
exports.CreateRepurchaseEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateRepurchaseEntryDto {
    transactionRef;
    memberId;
    amount;
    transactionDate;
    remarks;
    createdBy;
}
exports.CreateRepurchaseEntryDto = CreateRepurchaseEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'REP-2026-00001',
        description: 'Unique Transaction Reference Code',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.transaction_ref || obj?.transactionRef),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepurchaseEntryDto.prototype, "transactionRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        description: 'Member UUID or Member Code (e.g. AK10001)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.member_id || obj?.memberId),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRepurchaseEntryDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1500.5,
        description: 'Repurchase Purchase Amount (must be > 0)',
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateRepurchaseEntryDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-08-06T12:00:00.000Z',
        description: 'Transaction Date',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.transaction_date || obj?.transactionDate),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRepurchaseEntryDto.prototype, "transactionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Monthly product repurchase order #1042',
        description: 'Optional transaction notes or remarks',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRepurchaseEntryDto.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'c3d4e5f6-a7b8-9012-cdef-3456789012cd',
        description: 'User/Admin UUID who recorded entry',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRepurchaseEntryDto.prototype, "createdBy", void 0);
//# sourceMappingURL=create-repurchase-entry.dto.js.map