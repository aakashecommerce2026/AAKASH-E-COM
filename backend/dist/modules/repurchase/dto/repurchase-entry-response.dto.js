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
exports.RepurchaseEntryResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class RepurchaseEntryResponseDto {
    id;
    transactionRef;
    memberId;
    amount;
    transactionDate;
    remarks;
    createdBy;
    createdAt;
    updatedAt;
}
exports.RepurchaseEntryResponseDto = RepurchaseEntryResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d4e5' }),
    __metadata("design:type", String)
], RepurchaseEntryResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'REP-2026-00001' }),
    __metadata("design:type", String)
], RepurchaseEntryResponseDto.prototype, "transactionRef", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' }),
    __metadata("design:type", String)
], RepurchaseEntryResponseDto.prototype, "memberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1500.50 }),
    __metadata("design:type", Object)
], RepurchaseEntryResponseDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], RepurchaseEntryResponseDto.prototype, "transactionDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Monthly product repurchase order #1042' }),
    __metadata("design:type", Object)
], RepurchaseEntryResponseDto.prototype, "remarks", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'c3d4e5f6-a7b8-9012-cdef-3456789012cd' }),
    __metadata("design:type", Object)
], RepurchaseEntryResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], RepurchaseEntryResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-06T12:00:00.000Z' }),
    __metadata("design:type", Date)
], RepurchaseEntryResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=repurchase-entry-response.dto.js.map