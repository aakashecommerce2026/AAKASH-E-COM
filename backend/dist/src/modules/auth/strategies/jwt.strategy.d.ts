import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    memberCode: string;
    role: string;
    type: string;
    iat?: number;
    exp?: number;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly prisma;
    constructor(configService: ConfigService, prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
        id: string;
        memberCode: string;
        name: string;
        mobile: string;
        email: string | null;
        status: import("@prisma/client").$Enums.MemberStatus;
        role: import("@prisma/client").$Enums.MemberRole;
    }>;
}
export {};
