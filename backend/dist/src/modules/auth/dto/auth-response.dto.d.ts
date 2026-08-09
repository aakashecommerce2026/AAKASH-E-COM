export declare class AuthUserDto {
    id: string;
    memberCode: string;
    name: string;
    email: string | null;
    mobile: string;
    role: string;
    status: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: AuthUserDto;
}
