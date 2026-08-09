import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!user.role) {
      throw new ForbiddenException('Access denied: User has no role assigned');
    }

    const hasRole = requiredRoles.includes(user.role as MemberRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Endpoint requires [${requiredRoles.join(', ')}] role but user has [${user.role}]`,
      );
    }

    return true;
  }
}
