import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { SystemSettingsService } from './system-settings.service';
import {
  UpdateTdsStatusDto,
  TdsStatusResponseDto,
} from './dto/system-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('System Settings')
@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get('tds')
  @ApiOperation({
    summary: 'Get current system-wide TDS statutory tax deductions setting',
  })
  @ApiResponse({ status: 200, type: TdsStatusResponseDto })
  async getTdsStatus(): Promise<TdsStatusResponseDto> {
    const enabled = await this.systemSettingsService.isTdsEnabled();
    return {
      enabled,
      message: enabled
        ? 'Statutory tax deductions (5% TDS + 5% Admin fee) ENABLED system-wide.'
        : 'Statutory tax deductions (5% TDS + 5% Admin fee) DISABLED system-wide.',
    };
  }

  @Patch('tds')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Toggle system-wide TDS statutory tax deductions (Admin only)',
  })
  @ApiResponse({ status: 200, type: TdsStatusResponseDto })
  async updateTdsStatus(
    @Body() dto: UpdateTdsStatusDto,
    @CurrentUser('id') actorId: string,
    @CurrentUser('role') actorRole: MemberRole,
  ): Promise<TdsStatusResponseDto> {
    return this.systemSettingsService.setTdsEnabled(
      dto.enabled,
      actorId,
      actorRole,
    );
  }
}
