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
exports.ProcessDistributionBatchDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class ProcessDistributionBatchDto {
    cutoffDate;
    membershipLedgerIds;
    repurchaseLedgerIds;
    memberIds;
    remarks;
}
exports.ProcessDistributionBatchDto = ProcessDistributionBatchDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-08-31T23:59:59.999Z',
        description: 'Process all pending ledgers created on or before this cutoff date',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.cutoff_date || obj?.cutoffDate),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ProcessDistributionBatchDto.prototype, "cutoffDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Explicit list of membership commission ledger UUIDs to process',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProcessDistributionBatchDto.prototype, "membershipLedgerIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Explicit list of repurchase commission ledger UUIDs to process',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProcessDistributionBatchDto.prototype, "repurchaseLedgerIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter processing to specific member UUIDs',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ProcessDistributionBatchDto.prototype, "memberIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 'Monthly payout run for August 2026',
        description: 'Batch notes or remarks',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProcessDistributionBatchDto.prototype, "remarks", void 0);
//# sourceMappingURL=process-distribution-batch.dto.js.map