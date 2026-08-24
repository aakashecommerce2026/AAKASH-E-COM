import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberRole } from '@prisma/client';
import { PromotionsService } from './promotions.service';

@ApiTags('Member Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get('my-status')
  @ApiOperation({
    summary: 'Get logged in member promotion rank status and progress',
  })
  async getMyStatus(@Req() req: any) {
    const memberId = req.user.sub || req.user.id;
    return this.promotionsService.getPromotionProgress(memberId);
  }

  @Get('progress/:memberId')
  @ApiOperation({
    summary: 'Get promotion progress and rank history for a specific member',
  })
  async getMemberProgress(
    @Param('memberId') memberId: string,
    @Req() req: any,
  ) {
    const actorId = req.user.sub || req.user.id;
    const actorRole = req.user.role;

    if (
      actorRole !== MemberRole.ADMIN &&
      actorRole !== MemberRole.SUB_ADMIN &&
      actorId !== memberId
    ) {
      throw new ForbiddenException(
        'Access denied to other member promotion records',
      );
    }

    return this.promotionsService.getPromotionProgress(memberId);
  }

  @Post('admin/recalculate')
  @Roles(MemberRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk recalculate and update ranks for all members (Admin only)',
  })
  async recalculateAllRanks() {
    return this.promotionsService.recalculateAllMemberRanks();
  }
}
