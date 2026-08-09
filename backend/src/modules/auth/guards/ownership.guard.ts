import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Admins and Sub-Admins have global access across all records
    if (user.role === MemberRole.ADMIN || user.role === MemberRole.SUB_ADMIN) {
      return true;
    }

    // Identify target ID parameter from request params (id, memberId, userId, memberCode) or body
    const params = request.params || {};
    const body = request.body || {};

    const targetId =
      params.id ||
      params.memberId ||
      params.userId ||
      params.memberCode ||
      body.memberId;

    // If no target ID is present in request, allow pass-through
    if (!targetId) {
      return true;
    }

    // Check if targetId matches member's id or memberCode
    const isOwner = targetId === user.id || targetId === user.memberCode;

    if (!isOwner) {
      throw new ForbiddenException(
        'Access denied: You can only access or modify your own records',
      );
    }

    return true;
  }
}
