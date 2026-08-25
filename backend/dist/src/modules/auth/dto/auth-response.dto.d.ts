export declare class AuthUserDto {
    id: string;
    memberCode: string;
    name: string;
    username?: string | null;
    email: string | null;
    mobile: string;
    address?: string | null;
    profilePhoto?: string | null;
    role: string;
    status: string;
    rank?: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: AuthUserDto;
}
