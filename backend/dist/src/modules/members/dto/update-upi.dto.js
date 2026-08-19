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
exports.UpdateUpiDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UpdateUpiDto {
    upiId;
    upiName;
}
exports.UpdateUpiDto = UpdateUpiDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UPI ID / VPA handle (e.g. name@okaxis, 9876543210@upi)',
        example: 'john.doe@okaxis',
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, {
        message: 'Invalid UPI ID format (expected handle@bank or handle@upi)',
    }),
    __metadata("design:type", String)
], UpdateUpiDto.prototype, "upiId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Account Holder / UPI Registered Name',
        example: 'John Doe',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateUpiDto.prototype, "upiName", void 0);
//# sourceMappingURL=update-upi.dto.js.map