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
exports.QueryAdminRepurchaseEarningsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class QueryAdminRepurchaseEarningsDto {
    startDate;
    endDate;
    memberId;
    beneficiaryMemberId;
    sourceMemberId;
    level;
    status;
    page = 1;
    limit = 10;
    sortBy = 'createdAt';
    sortOrder = 'desc';
}
exports.QueryAdminRepurchaseEarningsDto = QueryAdminRepurchaseEarningsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by start date (ISO string e.g. 2026-01-01)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.start_date || obj?.startDate),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by end date (ISO string e.g. 2026-12-31)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.end_date || obj?.endDate),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by general member ID (matches source or beneficiary)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.member_id || obj?.memberId),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by beneficiary member ID (earner)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.beneficiary_member_id || obj?.beneficiaryMemberId),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "beneficiaryMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by source member ID (purchaser)',
    }),
    (0, class_transformer_1.Transform)(({ obj, value }) => value || obj?.source_member_id || obj?.sourceMemberId),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "sourceMemberId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by level (1 to 20)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], QueryAdminRepurchaseEarningsDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: client_1.CommissionStatus,
        description: 'Filter by commission status',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.CommissionStatus),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryAdminRepurchaseEarningsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryAdminRepurchaseEarningsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort field', default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Sort direction',
        enum: ['asc', 'desc'],
        default: 'desc',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryAdminRepurchaseEarningsDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=query-admin-repurchase-earnings.dto.js.map