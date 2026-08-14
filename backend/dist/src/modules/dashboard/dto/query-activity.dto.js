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
exports.QueryActivityDto = exports.ActivityCategory = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
var ActivityCategory;
(function (ActivityCategory) {
    ActivityCategory["ALL"] = "ALL";
    ActivityCategory["MEMBER_REGISTRATION"] = "MEMBER_REGISTRATION";
    ActivityCategory["REPURCHASE"] = "REPURCHASE";
    ActivityCategory["DISTRIBUTION"] = "DISTRIBUTION";
    ActivityCategory["SYSTEM_ACTIVITY"] = "SYSTEM_ACTIVITY";
})(ActivityCategory || (exports.ActivityCategory = ActivityCategory = {}));
class QueryActivityDto {
    type = ActivityCategory.ALL;
    startDate;
    endDate;
    page = 1;
    limit = 10;
    refresh = false;
}
exports.QueryActivityDto = QueryActivityDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: ActivityCategory,
        description: 'Filter by activity category',
        default: ActivityCategory.ALL,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ActivityCategory),
    __metadata("design:type", String)
], QueryActivityDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by start date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryActivityDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by end date (ISO string)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], QueryActivityDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], QueryActivityDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], QueryActivityDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Bypass cache and force real-time calculation',
        default: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true || value === '1' || value === 1),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], QueryActivityDto.prototype, "refresh", void 0);
//# sourceMappingURL=query-activity.dto.js.map