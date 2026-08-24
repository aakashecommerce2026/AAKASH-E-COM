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
exports.MembershipCommissionConfigResponseDto = exports.CreateCommissionConfigDto = exports.LevelRateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class LevelRateDto {
    level;
    percentage;
    description;
}
exports.LevelRateDto = LevelRateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Downline Level (1..20)' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], LevelRateDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10.0, description: 'Percentage rate for this level' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], LevelRateDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Level 1 Sponsor Commission' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LevelRateDto.prototype, "description", void 0);
class CreateCommissionConfigDto {
    version;
    rates;
    isActive;
}
exports.CreateCommissionConfigDto = CreateCommissionConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 2,
        description: 'Version number for rate table configuration',
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateCommissionConfigDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [LevelRateDto],
        description: 'List of rates for 20 levels',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LevelRateDto),
    __metadata("design:type", Array)
], CreateCommissionConfigDto.prototype, "rates", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        example: true,
        description: 'Set as current active version',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCommissionConfigDto.prototype, "isActive", void 0);
class MembershipCommissionConfigResponseDto {
    id;
    version;
    level;
    percentage;
    isActive;
    description;
    createdAt;
    updatedAt;
}
exports.MembershipCommissionConfigResponseDto = MembershipCommissionConfigResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' }),
    __metadata("design:type", String)
], MembershipCommissionConfigResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], MembershipCommissionConfigResponseDto.prototype, "version", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    __metadata("design:type", Number)
], MembershipCommissionConfigResponseDto.prototype, "level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10.0 }),
    __metadata("design:type", Object)
], MembershipCommissionConfigResponseDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true }),
    __metadata("design:type", Boolean)
], MembershipCommissionConfigResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Level 1 Sponsor Commission' }),
    __metadata("design:type", Object)
], MembershipCommissionConfigResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MembershipCommissionConfigResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], MembershipCommissionConfigResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=membership-commission-config.dto.js.map