import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole, MemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class MembersService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Auto-generates a unique member code in AK10001+ format.
   */
  async generateMemberCode(): Promise<string> {
    const count = await this.prisma.member.count();
    let nextNum = 10001 + count;
    let code = `AK${nextNum}`;

    let exists = await this.prisma.member.findUnique({ where: { memberCode: code } });
    while (exists) {
      nextNum++;
      code = `AK${nextNum}`;
      exists = await this.prisma.member.findUnique({ where: { memberCode: code } });
    }

    return code;
  }

  /**
   * Generates a temporary random password (e.g., AK@a1b2c3d4).
   */
  generateTempPassword(): string {
    const randomChars = Math.random().toString(36).substring(2, 8);
    return `AK@${randomChars}`;
  }

  /**
   * Public / General Member Creation (hashes password with 12 salt rounds).
   */
  async create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
    return this.createMemberInternal(createMemberDto);
  }

  /**
   * Admin Member Creation (supports auto-generating memberCode & temp password, links referrer).
   */
  async createByAdmin(
    dto: CreateAdminMemberDto,
  ): Promise<MemberResponseDto & { tempPassword?: string }> {
    let memberCode = dto.memberCode;
    if (!memberCode) {
      memberCode = await this.generateMemberCode();
    }

    let tempPassword = dto.password;
    let generatedTemp = false;

    if (!tempPassword) {
      tempPassword = this.generateTempPassword();
      generatedTemp = true;
    }

    const fullCreateDto: CreateMemberDto = {
      ...dto,
      memberCode,
      password: tempPassword,
    };

    const created = await this.createMemberInternal(fullCreateDto);

    return {
      ...created,
      ...(generatedTemp ? { tempPassword } : {}),
    };
  }

  private async createMemberInternal(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
    const { password, bankDetails, referrerId, role, status, ...rest } = createMemberDto;

    // Check uniqueness of memberCode, mobile, email
    const existing = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: rest.memberCode },
          { mobile: rest.mobile },
          ...(rest.email ? [{ email: rest.email }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.memberCode === rest.memberCode) {
        throw new ConflictException(`Member code '${rest.memberCode}' already exists`);
      }
      if (existing.mobile === rest.mobile) {
        throw new ConflictException(`Mobile number '${rest.mobile}' already exists`);
      }
      if (rest.email && existing.email === rest.email) {
        throw new ConflictException(`Email address '${rest.email}' already exists`);
      }
    }

    // Validate referrerId if provided (must exist and be ACTIVE)
    if (referrerId) {
      const referrer = await this.prisma.member.findUnique({
        where: { id: referrerId },
      });
      if (!referrer) {
        throw new BadRequestException(`Referrer with ID '${referrerId}' does not exist`);
      }
      if (referrer.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException(
          `Referrer with ID '${referrerId}' is not active (current status: ${referrer.status})`,
        );
      }
    }

    // Hash password with 12 salt rounds
    const passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);

    const createdMember = await this.prisma.member.create({
      data: {
        ...rest,
        passwordHash,
        referrerId: referrerId || null,
        role: role || MemberRole.MEMBER,
        status: status || MemberStatus.ACTIVE,
        bankDetails: bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : undefined,
      },
    });

    return this.mapToResponseDto(createdMember);
  }

  /**
   * Updates member details by ID.
   */
  async update(id: string, updateDto: UpdateMemberDto): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    const { password, bankDetails, referrerId, ...rest } = updateDto;

    // Check unique field collisions if changing memberCode, mobile, email
    if (rest.memberCode || rest.mobile || rest.email) {
      const existing = await this.prisma.member.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(rest.memberCode ? [{ memberCode: rest.memberCode }] : []),
                ...(rest.mobile ? [{ mobile: rest.mobile }] : []),
                ...(rest.email ? [{ email: rest.email }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        if (rest.memberCode && existing.memberCode === rest.memberCode) {
          throw new ConflictException(`Member code '${rest.memberCode}' is already taken`);
        }
        if (rest.mobile && existing.mobile === rest.mobile) {
          throw new ConflictException(`Mobile number '${rest.mobile}' is already taken`);
        }
        if (rest.email && existing.email === rest.email) {
          throw new ConflictException(`Email address '${rest.email}' is already taken`);
        }
      }
    }

    // Validate referrerId update if provided
    if (referrerId !== undefined) {
      if (referrerId === id) {
        throw new BadRequestException('A member cannot be set as their own referrer');
      }
      if (referrerId !== null) {
        const referrer = await this.prisma.member.findUnique({ where: { id: referrerId } });
        if (!referrer) {
          throw new BadRequestException(`Referrer with ID '${referrerId}' does not exist`);
        }
        if (referrer.status !== MemberStatus.ACTIVE) {
          throw new BadRequestException(
            `Referrer with ID '${referrerId}' is not active (current status: ${referrer.status})`,
          );
        }
      }
    }

    // Hash password if updated
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
    }

    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: {
        ...rest,
        ...(passwordHash ? { passwordHash } : {}),
        ...(referrerId !== undefined ? { referrerId } : {}),
        ...(bankDetails !== undefined
          ? { bankDetails: bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : null }
          : {}),
      },
    });

    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Retrieves single member by ID without relations.
   */
  async findById(id: string): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    return this.mapToResponseDto(member);
  }

  /**
   * Retrieves single member by ID with referrer info populated.
   */
  async findByIdWithReferrer(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        referrer: {
          select: {
            id: true,
            memberCode: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    const { passwordHash, ...result } = member;
    return result;
  }

  /**
   * Retrieves paginated member list with search and status/role filter.
   */
  async findAll(query: QueryMembersDto) {
    const { page = 1, limit = 10, search, status, role, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (role) {
      where.role = role;
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { memberCode: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }

    const validSortFields = ['createdAt', 'joiningDate', 'name', 'memberCode', 'status'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [total, members] = await Promise.all([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          referrer: {
            select: {
              id: true,
              memberCode: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const data = members.map((m) => this.mapToResponseDto(m));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves referrer information for a specific member ID.
   */
  async getReferrerInfo(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        memberCode: true,
        name: true,
        referrer: {
          select: {
            id: true,
            memberCode: true,
            name: true,
            email: true,
            mobile: true,
            status: true,
            role: true,
            joiningDate: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    return {
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.name,
      referrer: member.referrer || null,
    };
  }

  /**
   * Retrieves a shallow (1-level) downline preview of direct referrals for member ID.
   */
  async getDownlinePreview(id: string) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: { id: true, memberCode: true, name: true },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    const directReferrals = await this.prisma.member.findMany({
      where: { referrerId: id },
      select: {
        id: true,
        memberCode: true,
        name: true,
        mobile: true,
        email: true,
        status: true,
        role: true,
        joiningDate: true,
      },
      orderBy: { joiningDate: 'desc' },
    });

    const activeCount = directReferrals.filter((r) => r.status === MemberStatus.ACTIVE).length;

    return {
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: member.name,
      totalDirectReferrals: directReferrals.length,
      activeDirectReferrals: activeCount,
      directReferrals,
    };
  }

  private mapToResponseDto(member: any): MemberResponseDto {
    const { passwordHash, ...result } = member;
    return result as MemberResponseDto;
  }
}
