import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { QueryMembersDto } from './dto/query-members.dto';
import { ReassignReferrerDto } from './dto/reassign-referrer.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole, MemberStatus, Prisma } from '@prisma/client';
import { MembershipCommissionService } from '../membership-commission/membership-commission.service';

import { Optional } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { OtpService } from '../otp/otp.service';
import { OtpPurpose } from '../otp/enums/otp-purpose.enum';
import { PromotionsService } from '../promotions/promotions.service';

@Injectable()
export class MembersService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly membershipCommissionService: MembershipCommissionService,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly otpService?: OtpService,
    @Optional() private readonly promotionsService?: PromotionsService,
  ) {}

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
   * Public / General Member Creation.
   */
  async create(createMemberDto: CreateMemberDto, actorId?: string, actorRole?: MemberRole): Promise<MemberResponseDto> {
    return this.createMemberInternal(createMemberDto, actorId, actorRole);
  }

  /**
   * Admin Member Creation (supports auto-generating memberCode & temp password, links referrer).
   */
  async createByAdmin(
    dto: CreateAdminMemberDto,
    actorId?: string,
    actorRole?: MemberRole,
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

    const created = await this.createMemberInternal(fullCreateDto, actorId, actorRole);

    return {
      ...created,
      tempPassword,
    };
  }

  private async createMemberInternal(
    createMemberDto: CreateMemberDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<MemberResponseDto> {
    const { password, bankDetails, referrerId, role, status, otp, ...rest } = createMemberDto;

    // Verify Email OTP if provided
    if (this.otpService && otp && rest.email) {
      await this.otpService.verifyOtp({
        email: rest.email,
        otp,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
      });
    }

    // Check uniqueness of memberCode, mobile, email, username
    const existing = await this.prisma.member.findFirst({
      where: {
        OR: [
          { memberCode: rest.memberCode },
          { mobile: rest.mobile },
          ...(rest.email ? [{ email: rest.email }] : []),
          ...(rest.username ? [{ username: rest.username }] : []),
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
      if (rest.username && existing.username === rest.username) {
        throw new ConflictException(`Username '${rest.username}' already exists`);
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

    return this.prisma.$transaction(async (tx) => {
      // 1. Create member record atomically
      const createdMember = await tx.member.create({
        data: {
          ...rest,
          passwordHash,
          referrerId: referrerId || null,
          role: role || MemberRole.MEMBER,
          status: status || MemberStatus.ACTIVE,
          bankDetails: bankDetails ? JSON.parse(JSON.stringify(bankDetails)) : undefined,
        },
      });

      // 2. Trigger-on-registration 20-level commission engine atomically inside the same transaction
      const generatedCommissions = await this.membershipCommissionService.calculateForNewMember(
        createdMember.id,
        1000,
        tx,
      );

      // 3. Log member creation to activity_logs
      await this.auditService.logAction(
        {
          actorId: actorId || createdMember.id,
          actorRole: actorRole || createdMember.role,
          actionType: 'CREATE_MEMBER',
          entityType: 'Member',
          entityId: createdMember.id,
          metadata: {
            memberCode: createdMember.memberCode,
            name: createdMember.name,
            referrerId: createdMember.referrerId,
            role: createdMember.role,
          },
        },
        tx,
      );

      // 4. Log commission generation event to activity_logs
      if (generatedCommissions.length > 0) {
        const totalAmount = generatedCommissions.reduce(
          (sum, c) => sum + Number(c.amount),
          0,
        );

        await this.auditService.logAction(
          {
            actorId: actorId || createdMember.id,
            actorRole: actorRole || createdMember.role,
            actionType: 'GENERATE_MEMBERSHIP_COMMISSIONS',
            entityType: 'MembershipCommissionLedger',
            entityId: createdMember.id,
            metadata: {
              sourceMemberId: createdMember.id,
              memberCode: createdMember.memberCode,
              commissionsCount: generatedCommissions.length,
              totalCommissionAmount: totalAmount,
              beneficiaryCount: generatedCommissions.length,
            },
          },
          tx,
        );
      }

      // 5. Evaluate and auto-promote sponsor if milestone is hit
      if (this.promotionsService && referrerId) {
        await this.promotionsService.evaluateAndPromoteMember(referrerId, tx).catch(() => {});
      }

      const result = this.mapToResponseDto(createdMember);

      // Send welcome email asynchronously if email address is present
      if (this.emailService && createdMember.email) {
        this.emailService.sendWelcomeEmail(
          createdMember.email,
          createdMember.name,
          createdMember.memberCode,
        ).catch(() => {});
      }

      return result;
    });
  }

  /**
   * Updates member details by ID.
   */
  async update(
    id: string,
    updateDto: UpdateMemberDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<MemberResponseDto> {
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

    // Referrer update safeguard: If referrer is changed casually via PUT, check if commissions exist against this member
    if (referrerId !== undefined && referrerId !== member.referrerId) {
      const hasCommissions = await this.hasCommissionsAgainstMember(id);
      if (hasCommissions) {
        throw new BadRequestException(
          `Cannot change referrer via standard update because commissions exist against this member. Use the guarded POST /admin/members/${id}/reassign-referrer endpoint.`,
        );
      }

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

    // Log update to activity_logs
    await this.auditService.logAction({
      actorId: actorId || id,
      actorRole: actorRole || updatedMember.role,
      actionType: 'UPDATE_MEMBER',
      entityType: 'Member',
      entityId: updatedMember.id,
      metadata: {
        updatedFields: Object.keys(updateDto),
        newStatus: updatedMember.status,
      },
    });

    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Guarded flow to reassign a member's referrer.
   */
  async reassignReferrer(
    id: string,
    dto: ReassignReferrerDto,
    actorId?: string,
    actorRole?: MemberRole,
  ): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    const { newReferrerId, reason } = dto;

    if (newReferrerId === id) {
      throw new BadRequestException('A member cannot be set as their own referrer');
    }

    const newReferrer = await this.prisma.member.findUnique({ where: { id: newReferrerId } });
    if (!newReferrer) {
      throw new BadRequestException(`New referrer with ID '${newReferrerId}' does not exist`);
    }

    if (newReferrer.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException(
        `New referrer with ID '${newReferrerId}' is not active (status: ${newReferrer.status})`,
      );
    }

    // Cycle detection: Ensure newReferrerId is not a downline member of member 'id'
    const isCycle = await this.isMemberInUplineChain(newReferrerId, id);
    if (isCycle) {
      throw new BadRequestException(
        `Circular dependency detected: Member '${newReferrer.name}' is already in the downline of '${member.name}'`,
      );
    }

    const previousReferrerId = member.referrerId;

    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: { referrerId: newReferrerId },
    });

    // Audit log
    await this.auditService.logAction({
      actorId: actorId || null,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: 'REASSIGN_REFERRER',
      entityType: 'Member',
      entityId: id,
      metadata: {
        previousReferrerId,
        newReferrerId,
        reason,
      },
    });

    return this.mapToResponseDto(updatedMember);
  }

  /**
   * Helper to check if member 'targetId' is present in upline hierarchy of 'startMemberId'.
   */
  private async isMemberInUplineChain(startMemberId: string, targetId: string): Promise<boolean> {
    let currentId: string | null = startMemberId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === targetId) {
        return true;
      }
      visited.add(currentId);

      const parent: { referrerId: string | null } | null = await this.prisma.member.findUnique({
        where: { id: currentId },
        select: { referrerId: true },
      });

      if (!parent || !parent.referrerId || visited.has(parent.referrerId)) {
        break;
      }
      currentId = parent.referrerId;
    }

    return false;
  }

  /**
   * Checks if commissions exist in membership or repurchase ledgers against a member.
   */
  private async hasCommissionsAgainstMember(memberId: string): Promise<boolean> {
    const [membershipCount, repurchaseCount] = await Promise.all([
      this.prisma.membershipCommissionLedger.count({
        where: {
          OR: [{ sourceMemberId: memberId }, { beneficiaryMemberId: memberId }],
        },
      }),
      this.prisma.repurchaseCommissionLedger.count({
        where: {
          OR: [{ sourceMemberId: memberId }, { beneficiaryMemberId: memberId }],
        },
      }),
    ]);

    return membershipCount > 0 || repurchaseCount > 0;
  }

  async findById(id: string): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    return this.mapToResponseDto(member);
  }

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
