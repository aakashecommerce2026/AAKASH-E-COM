import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { DownlineAccessGuard } from './downline-access.guard';
import { HierarchyService } from '../../hierarchy/hierarchy.service';

describe('DownlineAccessGuard', () => {
  let guard: DownlineAccessGuard;
  let hierarchyService: jest.Mocked<Partial<HierarchyService>>;

  beforeEach(() => {
    hierarchyService = {
      isInDownlineOf: jest.fn(),
      isMemberInDownline: jest.fn(),
    };
    guard = new DownlineAccessGuard(hierarchyService as any);
  });

  const createMockContext = (user: any, params: any = {}, query: any = {}, body: any = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          query,
          body,
        }),
      }),
    } as ExecutionContext;
  };

  it('should throw UnauthorizedException if no user is attached to request', async () => {
    const context = createMockContext(null);
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow access if user is ADMIN', async () => {
    const context = createMockContext({ id: 'admin-id', role: MemberRole.ADMIN }, { memberId: 'target-id' });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should allow access if user is SUB_ADMIN', async () => {
    const context = createMockContext({ id: 'subadmin-id', role: MemberRole.SUB_ADMIN }, { memberId: 'target-id' });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should allow access if target member is user self', async () => {
    const context = createMockContext({ id: 'user-1', role: MemberRole.MEMBER }, { memberId: 'user-1' });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should allow access if target member is in user downline', async () => {
    (hierarchyService.isInDownlineOf as jest.Mock).mockResolvedValue(true);
    const context = createMockContext({ id: 'user-1', role: MemberRole.MEMBER }, { memberId: 'child-downline-id' });

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
    expect(hierarchyService.isInDownlineOf).toHaveBeenCalledWith('user-1', 'child-downline-id');
  });

  it('should throw ForbiddenException if target member is not in user downline', async () => {
    (hierarchyService.isInDownlineOf as jest.Mock).mockResolvedValue(false);
    const context = createMockContext({ id: 'user-1', role: MemberRole.MEMBER }, { memberId: 'stranger-id' });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    expect(hierarchyService.isInDownlineOf).toHaveBeenCalledWith('user-1', 'stranger-id');
  });

  it('should allow pass-through if no target ID parameter is present in request', async () => {
    const context = createMockContext({ id: 'user-1', role: MemberRole.MEMBER });
    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });
});
