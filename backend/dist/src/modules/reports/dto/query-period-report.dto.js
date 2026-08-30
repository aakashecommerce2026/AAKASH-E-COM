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
exports.QueryPeriodReportDto = exports.PeriodTypeEnum = exports.ReportType = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var ReportType;
(function (ReportType) {
    ReportType["MEMBER_REGISTRATIONS"] = "member-registrations";
    ReportType["REPURCHASE_ACTIVITIES"] = "repurchase-activities";
    ReportType["EARNINGS_SUMMARY"] = "earnings-summary";
    ReportType["BUSINESS_SUMMARY"] = "business-summary";
})(ReportType || (exports.ReportType = ReportType = {}));
var PeriodTypeEnum;
(function (PeriodTypeEnum) {
    PeriodTypeEnum["DAILY"] = "daily";
    PeriodTypeEnum["WEEKLY"] = "weekly";
    PeriodTypeEnum["MONTHLY"] = "monthly";
})(PeriodTypeEnum || (exports.PeriodTypeEnum = PeriodTypeEnum = {}));
class QueryPeriodReportDto {
    type = ReportType.BUSINESS_SUMMARY;
    period = PeriodTypeEnum.DAILY;
    startDate;
    endDate;
    async = false;
    page = 1;
    limit = 10;
}
exports.QueryPeriodReportDto = QueryPeriodReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ReportType,
        description: 'Type of report to generate (member-registrations, repurchase-activities, earnings-summary, business-summary)',
        default: ReportType.BUSINESS_SUMMARY,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReportType),
    __metadata("design:type", String)
], QueryPeriodReportDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: PeriodTypeEnum,
        description: 'Periodicity bucket for reporting (daily, weekly, monthly)',
        default: PeriodTypeEnum.DAILY,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PeriodTypeEnum),
    __metadata("design:type", String)
], QueryPeriodReportDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by start date (ISO string e.g. 2026-01-01)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPeriodReportDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter by end date (ISO string e.g. 2026-12-31)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryPeriodReportDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Run export asynchronously via Bull queue',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryPeriodReportDto.prototype, "async", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Page number for paginated list items',
        default: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryPeriodReportDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], QueryPeriodReportDto.prototype, "limit", void 0);
//# sourceMappingURL=query-period-report.dto.js.map