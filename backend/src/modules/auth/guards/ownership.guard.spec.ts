import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { OwnershipGuard } from './ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;

  const mockExecutionContext = (
    user?: any,
    params: any = {},
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params,
          body: {},
        }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    guard = new OwnershipGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow ADMIN to access any member record by ID', () => {
    const context = mockExecutionContext(
      { id: 'admin-uuid', role: MemberRole.ADMIN },
      { id: 'member-uuid-99' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow MEMBER to access their OWN record by ID', () => {
    const context = mockExecutionContext(
      { id: 'member-uuid-1', memberCode: 'AK10001', role: MemberRole.MEMBER },
      { id: 'member-uuid-1' },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should BLOCK MEMBER from accessing ANOTHER member record by ID and throw ForbiddenException', () => {
    const context = mockExecutionContext(
      { id: 'member-uuid-1', memberCode: 'AK10001', role: MemberRole.MEMBER },
      { id: 'other-member-uuid-2' },
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException if no user on request', () => {
    const context = mockExecutionContext(undefined, { id: 'member-uuid-1' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
