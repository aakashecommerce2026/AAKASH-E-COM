import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-jwt-secret-key-12345',
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const member = await this.prisma.member.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        memberCode: true,
        name: true,
        email: true,
        mobile: true,
        role: true,
        status: true,
      },
    });

    if (!member) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (member.status === 'BLOCKED' || member.status === 'SUSPENDED') {
      throw new UnauthorizedException('User account is restricted');
    }

    return member;
  }
}
