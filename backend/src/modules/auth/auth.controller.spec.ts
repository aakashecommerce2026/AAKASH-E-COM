import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MemberRole, MemberStatus } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockAuthResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: 'member-uuid-1',
      memberCode: 'AK10001',
      name: 'John Doe',
      email: 'john@example.com',
      mobile: '+919876543210',
      role: MemberRole.MEMBER,
      status: MemberStatus.ACTIVE,
    },
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue(mockAuthResponse),
      refreshToken: jest.fn().mockResolvedValue(mockAuthResponse),
      changePassword: jest.fn().mockResolvedValue({ message: 'Password changed successfully' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login should return AuthResponseDto', async () => {
    const result = await controller.login({
      identifier: 'AK10001',
      password: 'Password123!',
    });

    expect(authService.login).toHaveBeenCalledWith({
      identifier: 'AK10001',
      password: 'Password123!',
    });
    expect(result).toEqual(mockAuthResponse);
  });

  it('refresh should return rotated tokens', async () => {
    const result = await controller.refresh({ refreshToken: 'mock-refresh-token' });

    expect(authService.refreshToken).toHaveBeenCalledWith({ refreshToken: 'mock-refresh-token' });
    expect(result).toEqual(mockAuthResponse);
  });

  it('changePassword should delegate to authService', async () => {
    const result = await controller.changePassword('member-uuid-1', {
      currentPassword: 'CurrentPassword1!',
      newPassword: 'NewPassword1!',
    });

    expect(authService.changePassword).toHaveBeenCalledWith('member-uuid-1', {
      currentPassword: 'CurrentPassword1!',
      newPassword: 'NewPassword1!',
    });
    expect(result).toEqual({ message: 'Password changed successfully' });
  });
});
