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
exports.AuthResponseDto = exports.AuthUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthUserDto {
    id;
    memberCode;
    name;
    username;
    email;
    mobile;
    address;
    profilePhoto;
    role;
    status;
    rank;
}
exports.AuthUserDto = AuthUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'AK10001' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "memberCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'johndoe', nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com', nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+919876543210' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "mobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123 Main Street, City', nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '/uploads/profile-photos/avatar.jpg', nullable: true }),
    __metadata("design:type", Object)
], AuthUserDto.prototype, "profilePhoto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MEMBER' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ACTIVE' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BRONZE' }),
    __metadata("design:type", String)
], AuthUserDto.prototype, "rank", void 0);
class AuthResponseDto {
    accessToken;
    refreshToken;
    user;
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT Access Token (15m expiry)',
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT Refresh Token (7d expiry)',
    }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "refreshToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: AuthUserDto }),
    __metadata("design:type", AuthUserDto)
], AuthResponseDto.prototype, "user", void 0);
//# sourceMappingURL=auth-response.dto.js.map