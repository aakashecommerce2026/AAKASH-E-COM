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
exports.NetworkGrowthQueryDto = exports.NetworkGrowthGroupBy = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var NetworkGrowthGroupBy;
(function (NetworkGrowthGroupBy) {
    NetworkGrowthGroupBy["WEEK"] = "week";
    NetworkGrowthGroupBy["MONTH"] = "month";
})(NetworkGrowthGroupBy || (exports.NetworkGrowthGroupBy = NetworkGrowthGroupBy = {}));
class NetworkGrowthQueryDto {
    groupBy = NetworkGrowthGroupBy.MONTH;
    maxLevels = 20;
    startDate;
    endDate;
}
exports.NetworkGrowthQueryDto = NetworkGrowthQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: NetworkGrowthGroupBy,
        default: NetworkGrowthGroupBy.MONTH,
        description: 'Time bucket period for grouping growth statistics (week or month)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NetworkGrowthGroupBy),
    __metadata("design:type", String)
], NetworkGrowthQueryDto.prototype, "groupBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: 20,
        default: 20,
        description: 'Maximum depth levels to traverse (capped at 20)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], NetworkGrowthQueryDto.prototype, "maxLevels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-01-01T00:00:00.000Z',
        description: 'Optional start date filter (ISO string)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], NetworkGrowthQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: '2026-12-31T23:59:59.999Z',
        description: 'Optional end date filter (ISO string)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], NetworkGrowthQueryDto.prototype, "endDate", void 0);
//# sourceMappingURL=network-growth-query.dto.js.map