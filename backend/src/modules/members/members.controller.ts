import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';
import { MembersService } from './members.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new member (hashes password with 12 bcrypt salt rounds)',
  })
  @ApiResponse({
    status: 201,
    description: 'Member created successfully',
    type: MemberResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({
    status: 409,
    description: 'Member code, mobile, or email already exists',
  })
  async create(
    @Body() createMemberDto: CreateMemberDto,
  ): Promise<MemberResponseDto> {
    return this.membersService.create(createMemberDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated member list with search and filters',
  })
  @ApiResponse({ status: 200, description: 'Paginated members response' })
  async findAll(@Query() query: QueryMembersDto) {
    return this.membersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, OwnershipGuard)
  @Roles(MemberRole.ADMIN, MemberRole.SUB_ADMIN, MemberRole.MEMBER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get member details by ID (Protected by Roles & Ownership Guard)',
  })
  @ApiResponse({ status: 200, type: MemberResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: Insufficient role permissions or ownership check failed',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async findOne(@Param('id') id: string): Promise<MemberResponseDto> {
    return this.membersService.findById(id);
  }
}
