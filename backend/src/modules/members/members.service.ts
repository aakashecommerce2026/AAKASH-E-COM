import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { MemberRole, MemberStatus } from '@prisma/client';

@Injectable()
export class MembersService {
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new member with bcrypt password hashing using 12 salt rounds.
   */
  async create(createMemberDto: CreateMemberDto): Promise<MemberResponseDto> {
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

    // Validate referrerId if provided
    if (referrerId) {
      const referrer = await this.prisma.member.findUnique({
        where: { id: referrerId },
      });
      if (!referrer) {
        throw new BadRequestException(`Referrer with ID '${referrerId}' not found`);
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

  async findById(id: string): Promise<MemberResponseDto> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${id}' not found`);
    }

    return this.mapToResponseDto(member);
  }

  private mapToResponseDto(member: any): MemberResponseDto {
    const { passwordHash, ...result } = member;
    return result as MemberResponseDto;
  }
}
