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
import { MemberStatus, Prisma } from '@prisma/client';

@Injectable()
export class RepurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Creates an in-store repurchase entry.
   * Validates:
   * 1. transactionRef is unique.
   * 2. memberId exists and is ACTIVE.
   */
  async create(dto: CreateRepurchaseEntryDto, actorId?: string) {
    const { transactionRef, memberId, amount, transactionDate, remarks, createdBy } = dto;

    // 1. Transaction reference uniqueness check
    const existingRef = await this.prisma.repurchaseEntry.findUnique({
      where: { transactionRef },
    });

    if (existingRef) {
      throw new ConflictException(`Transaction reference '${transactionRef}' already exists`);
    }

    // 2. Member existence & ACTIVE status check
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID '${memberId}' does not exist`);
    }

    if (member.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException(
        `Member with ID '${memberId}' is not active (current status: ${member.status})`,
      );
    }

    const creatorId = actorId || createdBy || null;

    // 3. Create entry in DB
    const entry = await this.prisma.repurchaseEntry.create({
      data: {
        transactionRef,
        memberId,
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

    // 4. Log audit action
    await this.auditService.logAction({
      actorId: creatorId,
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
   * Retrieves paginated list of repurchase entries with search & filters.
   */
  async findAll(query: QueryRepurchaseEntryDto) {
    const { page = 1, limit = 10, memberId, search, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RepurchaseEntryWhereInput = {};

    if (memberId) {
      where.memberId = memberId;
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
      where.OR = [
        { transactionRef: { contains: term, mode: 'insensitive' } },
        { member: { name: { contains: term, mode: 'insensitive' } } },
        { member: { memberCode: { contains: term, mode: 'insensitive' } } },
        { member: { mobile: { contains: term } } },
      ];
    }

    const validSortFields = ['transactionDate', 'createdAt', 'amount', 'transactionRef'];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'transactionDate';

    const [total, entries] = await Promise.all([
      this.prisma.repurchaseEntry.count({ where }),
      this.prisma.repurchaseEntry.findMany({
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

    const data = entries.map((e) => this.mapToResponseDto(e));

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
   * Retrieves single repurchase entry by ID.
   */
  async findById(id: string) {
    const entry = await this.prisma.repurchaseEntry.findUnique({
      where: { id },
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
   */
  async update(id: string, dto: UpdateRepurchaseEntryDto, actorId?: string) {
    const existing = await this.prisma.repurchaseEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Repurchase entry with ID '${id}' not found`);
    }

    const { transactionRef, memberId, amount, transactionDate, remarks } = dto;

    // Check transactionRef collision if changing ref
    if (transactionRef && transactionRef !== existing.transactionRef) {
      const collision = await this.prisma.repurchaseEntry.findUnique({
        where: { transactionRef },
      });
      if (collision) {
        throw new ConflictException(`Transaction reference '${transactionRef}' is already taken`);
      }
    }

    // Check member existence and status if changing memberId
    if (memberId && memberId !== existing.memberId) {
      const member = await this.prisma.member.findUnique({ where: { id: memberId } });
      if (!member) {
        throw new NotFoundException(`Member with ID '${memberId}' does not exist`);
      }
      if (member.status !== MemberStatus.ACTIVE) {
        throw new BadRequestException(
          `Member with ID '${memberId}' is not active (current status: ${member.status})`,
        );
      }
    }

    const updated = await this.prisma.repurchaseEntry.update({
      where: { id },
      data: {
        ...(transactionRef ? { transactionRef } : {}),
        ...(memberId ? { memberId } : {}),
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

    await this.auditService.logAction({
      actorId: actorId || null,
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
   * Removes repurchase entry by ID.
   */
  async remove(id: string, actorId?: string) {
    const existing = await this.prisma.repurchaseEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Repurchase entry with ID '${id}' not found`);
    }

    const deleted = await this.prisma.repurchaseEntry.delete({
      where: { id },
    });

    await this.auditService.logAction({
      actorId: actorId || null,
      actionType: 'DELETE_REPURCHASE_ENTRY',
      entityType: 'RepurchaseEntry',
      entityId: id,
      metadata: {
        transactionRef: existing.transactionRef,
      },
    });

    return { message: `Repurchase entry '${existing.transactionRef}' deleted successfully` };
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
    };
  }
}
