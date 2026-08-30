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
exports.QueryExportReportDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const query_period_report_dto_1 = require("./query-period-report.dto");
class QueryExportReportDto {
    type;
    period = 'daily';
    startDate;
    endDate;
    async = false;
}
exports.QueryExportReportDto = QueryExportReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: query_period_report_dto_1.ReportType,
        description: 'Type of report to export (member-registrations, repurchase-activities, earnings-summary, business-summary)',
    }),
    (0, class_validator_1.IsEnum)(query_period_report_dto_1.ReportType),
    __metadata("design:type", String)
], QueryExportReportDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Periodicity of report (daily, weekly, monthly)',
        default: 'daily',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryExportReportDto.prototype, "period", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Start date (ISO string e.g. 2026-01-01)',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryExportReportDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date (ISO string e.g. 2026-12-31)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryExportReportDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'If true, processes export asynchronously via Bull queue',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryExportReportDto.prototype, "async", void 0);
//# sourceMappingURL=query-export-report.dto.js.map