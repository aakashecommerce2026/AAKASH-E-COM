import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { MemberRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user?: any): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access if no roles are required on handler/class', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = mockExecutionContext({ role: MemberRole.MEMBER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required ADMIN role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([MemberRole.ADMIN]);
    const context = mockExecutionContext({ role: MemberRole.ADMIN });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should BLOCK a MEMBER from hitting an ADMIN route and throw ForbiddenException', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([MemberRole.ADMIN]);
    const context = mockExecutionContext({ role: MemberRole.MEMBER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException if no user is present on request', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue([MemberRole.ADMIN]);
    const context = mockExecutionContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
