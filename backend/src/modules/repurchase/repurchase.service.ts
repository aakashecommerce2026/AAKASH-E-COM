import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRepurchaseEntryDto } from './dto/create-repurchase-entry.dto';
import { UpdateRepurchaseEntryDto } from './dto/update-repurchase-entry.dto';
import { QueryRepurchaseEntryDto } from './dto/query-repurchase-entry.dto';
import { MemberRole, MemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class RepurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Helper to check if repurchase commission ledgers exist for an entry.
   */
  private async hasCommissionsGenerated(repurchaseEntryId: string): Promise<boolean> {
    const count = await this.prisma.repurchaseCommissionLedger.count({
      where: { repurchaseEntryId },
    });
    return count > 0;
  }

  /**
   * Creates an in-store repurchase entry.
   * Validates:
   * 1. transactionRef is unique (enforced at service level + DB level P2002 error mapping).
   * 2. memberId / memberCode exists and is ACTIVE.
   * 3. Logs CREATE_REPURCHASE_ENTRY action to activity_logs.
   */
  async create(dto: CreateRepurchaseEntryDto, actorId?: string, actorRole?: MemberRole) {
    const { transactionRef, memberId, amount, transactionDate, remarks, createdBy } = dto;

    // 1. Transaction reference uniqueness check
    const existingRef = await (this.prisma as any).repurchaseEntry.findFirst({
      where: { transactionRef, deletedAt: null },
    });

    if (existingRef) {
      throw new ConflictException(`Transaction reference '${transactionRef}' already exists`);
    }

    // 2. Member existence & ACTIVE status check (supports UUID or memberCode lookup)
    const member = await this.prisma.member.findFirst({
      where: {
        OR: [
          { id: memberId },
          { memberCode: memberId },
        ],
      },
    });

    if (!member) {
      throw new NotFoundException(`Member '${memberId}' does not exist`);
    }

    if (member.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException(
        `Member '${member.name}' (${member.memberCode}) is not active (current status: ${member.status})`,
      );
    }

    const creatorId = actorId || createdBy || null;

    // 3. Create entry in DB using verified member.id (with DB-level P2002 error handling)
    let entry: any;
    try {
      entry = await this.prisma.repurchaseEntry.create({
        data: {
          transactionRef,
          memberId: member.id,
          amount: new Prisma.Decimal(amount),
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          remarks: remarks || null,
          createdBy: creatorId,
        },
        include: {
          member: {
            select: { id: true, memberCode: true, name: true, mobile: true, status: true },
          },
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Transaction reference '${transactionRef}' already exists`);
      }
      throw error;
    }

    // 4. Log audit action
    await this.auditService.logAction({
      actorId: creatorId,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: 'CREATE_REPURCHASE_ENTRY',
      entityType: 'RepurchaseEntry',
      entityId: entry.id,
      metadata: {
        transactionRef: entry.transactionRef,
        memberId: entry.memberId,
        amount: Number(entry.amount),
      },
    });

    return this.mapToResponseDto(entry);
  }

  /**
   * Retrieves paginated list of repurchase entries with search & filters (excluding soft-deleted).
   */
  async findAll(query: QueryRepurchaseEntryDto) {
    const { page = 1, limit = 10, memberId, search, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (memberId) {
      where.OR = [
        { memberId },
        { member: { memberCode: memberId } },
      ];
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) where.transactionDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      const searchWhere: any = {
        OR: [
          { transactionRef: { contains: term, mode: 'insensitive' } },
          { member: { name: { contains: term, mode: 'insensitive' } } },
          { member: { memberCode: { contains: term, mode: 'insensitive' } } },
          { member: { mobile: { contains: term } } },
        ],
      };

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          searchWhere,
        ];
        delete where.OR;
      } else {
        where.OR = searchWhere.OR;
      }
    }

    const validSortFields = ['transactionDate', 'createdAt', 'amount', 'transactionRef'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'transactionDate';

    const [total, entries] = await Promise.all([
      (this.prisma as any).repurchaseEntry.count({ where }),
      (this.prisma as any).repurchaseEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: sortOrder },
        include: {
          member: {
            select: { id: true, memberCode: true, name: true, mobile: true, status: true },
          },
        },
      }),
    ]);

    const data = entries.map((e: any) => this.mapToResponseDto(e));

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
   * Retrieves single repurchase entry by ID (excluding soft-deleted).
   */
  async findById(id: string) {
    const entry = await (this.prisma as any).repurchaseEntry.findFirst({
      where: { id, deletedAt: null },
      include: {
        member: {
          select: { id: true, memberCode: true, name: true, mobile: true, status: true },
        },
      },
    });

    if (!entry) {
      throw new NotFoundException(`Repurchase entry with ID '${id}' not found`);
    }

    return this.mapToResponseDto(entry);
  }

  /**
   * Updates existing repurchase entry.
   * Lock safeguard: Editing is blocked if commission ledgers have already been generated.
   * Logs UPDATE_REPURCHASE_ENTRY action to activity_logs.
   */
  async update(id: string, dto: UpdateRepurchaseEntryDto, actorId?: string, actorRole?: MemberRole) {
    const existing = await (this.prisma as any).repurchaseEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Repurchase entry with ID '${id}' not found`);
    }

    // Check post-commission locking
    const hasCommissions = await this.hasCommissionsGenerated(id);
    if (hasCommissions) {
      throw new BadRequestException(
        `Repurchase entry '${existing.transactionRef}' is locked because commissions have already been calculated. Please issue a separate correction or reversal entry.`,
      );
    }

    const { transactionRef, memberId, amount, transactionDate, remarks } = dto;

    // Check transactionRef collision if changing ref
    if (transactionRef && transactionRef !== existing.transactionRef) {
      const collision = await (this.prisma as any).repurchaseEntry.findFirst({
        where: { transactionRef, deletedAt: null },
      });
      if (collision) {
        throw new ConflictException(`Transaction reference '${transactionRef}' is already taken`);
      }
    }

    // Check member existence and status if changing memberId
    let updatedMemberId = existing.memberId;
    if (memberId && memberId !== existing.memberId) {
      const member = await this.prisma.member.findFirst({
        where: { OR: [{ id: memberId }, { memberCode: memberId }] },
      });
      if (!member) {
        throw new NotFoundException(`Member '${memberId}' does not exist`);
      }
      if (member.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException(
          `Member '${member.name}' (${member.memberCode}) is not active (current status: ${member.status})`,
        );
      }
      updatedMemberId = member.id;
    }

    let updated: any;
    try {
      updated = await (this.prisma as any).repurchaseEntry.update({
        where: { id },
        data: {
          ...(transactionRef ? { transactionRef } : {}),
          memberId: updatedMemberId,
          ...(amount ? { amount: new Prisma.Decimal(amount) } : {}),
          ...(transactionDate ? { transactionDate: new Date(transactionDate) } : {}),
          ...(remarks !== undefined ? { remarks } : {}),
        },
        include: {
          member: {
            select: { id: true, memberCode: true, name: true, mobile: true, status: true },
          },
        },
      });
    } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Transaction reference '${transactionRef}' is already taken`);
      }
      throw error;
    }

    await this.auditService.logAction({
      actorId: actorId || null,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: 'UPDATE_REPURCHASE_ENTRY',
      entityType: 'RepurchaseEntry',
      entityId: id,
      metadata: {
        updatedFields: Object.keys(dto),
      },
    });

    return this.mapToResponseDto(updated);
  }

  /**
   * Soft deletes repurchase entry by ID.
   * Lock safeguard: Soft delete is only permitted BEFORE commission generation.
   * Logs DELETE_REPURCHASE_ENTRY action to activity_logs.
   */
  async remove(id: string, actorId?: string, actorRole?: MemberRole) {
    const existing = await (this.prisma as any).repurchaseEntry.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException(`Repurchase entry with ID '${id}' not found`);
    }

    // Check pre-commission delete guard
    const hasCommissions = await this.hasCommissionsGenerated(id);
    if (hasCommissions) {
      throw new BadRequestException(
        `Cannot delete repurchase entry '${existing.transactionRef}' because commissions have already been generated for this transaction.`,
      );
    }

    const softDeleted = await (this.prisma as any).repurchaseEntry.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        transactionRef: `${existing.transactionRef}_deleted_${Date.now()}`,
      },
    });

    await this.auditService.logAction({
      actorId: actorId || null,
      actorRole: actorRole || MemberRole.ADMIN,
      actionType: 'DELETE_REPURCHASE_ENTRY',
      entityType: 'RepurchaseEntry',
      entityId: id,
      metadata: {
        transactionRef: existing.transactionRef,
        softDeleted: true,
      },
    });

    return { message: `Repurchase entry '${existing.transactionRef}' soft-deleted successfully` };
  }

  private mapToResponseDto(entry: any) {
    return {
      id: entry.id,
      transactionRef: entry.transactionRef,
      memberId: entry.memberId,
      member: entry.member,
      amount: Number(entry.amount),
      transactionDate: entry.transactionDate,
      remarks: entry.remarks,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      deletedAt: entry.deletedAt || undefined,
    };
  }
}
