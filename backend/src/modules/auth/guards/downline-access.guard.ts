import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { HierarchyService } from '../../hierarchy/hierarchy.service';

@Injectable()
export class DownlineAccessGuard implements CanActivate {
  constructor(private readonly hierarchyService: HierarchyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Admins and Sub-Admins have global unrestricted access across all downlines
    if (user.role === MemberRole.ADMIN || user.role === MemberRole.SUB_ADMIN) {
      return true;
    }

    // Extract target ID parameter from request route params, query, or body
    const params = request.params || {};
    const query = request.query || {};
    const body = request.body || {};

    const targetId =
      params.memberId ||
      params.id ||
      params.userId ||
      params.memberCode ||
      query.memberId ||
      body.memberId;

    // If no target ID specified in request context, allow pass-through
    if (!targetId) {
      return true;
    }

    // Users always have full access to their own records
    if (targetId === user.id || targetId === user.memberCode) {
      return true;
    }

    // Verify if target member belongs to user's downline tree
    const isDownline = await this.hierarchyService.isInDownlineOf(
      user.id,
      targetId,
    );

    if (!isDownline) {
      throw new ForbiddenException(
        'Access denied: You can only view or manage members within your own downline hierarchy',
      );
    }

    return true;
  }
}
