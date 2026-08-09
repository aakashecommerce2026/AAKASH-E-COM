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
exports.ReassignReferrerDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ReassignReferrerDto {
    newReferrerId;
    reason;
}
exports.ReassignReferrerDto = ReassignReferrerDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
        description: 'UUID of the new active Referrer Member',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'New Referrer ID is required' }),
    (0, class_validator_1.IsUUID)('4', { message: 'New Referrer ID must be a valid UUID' }),
    __metadata("design:type", String)
], ReassignReferrerDto.prototype, "newReferrerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Admin realignment of downline branch',
        description: 'Reason for reassigning referrer',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Reason for reassignment is required' }),
    __metadata("design:type", String)
], ReassignReferrerDto.prototype, "reason", void 0);
//# sourceMappingURL=reassign-referrer.dto.js.map