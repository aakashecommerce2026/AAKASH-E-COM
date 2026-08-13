"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepurchaseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let RepurchaseService = class RepurchaseService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(dto, actorId) {
        const { transactionRef, memberId, amount, transactionDate, remarks, createdBy } = dto;
        const existingRef = await this.prisma.repurchaseEntry.findUnique({
            where: { transactionRef },
        });
        if (existingRef) {
            throw new common_1.ConflictException(`Transaction reference '${transactionRef}' already exists`);
        }
        const member = await this.prisma.member.findUnique({
            where: { id: memberId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member with ID '${memberId}' does not exist`);
        }
        if (member.status !== client_1.MemberStatus.ACTIVE) {
            throw new common_1.BadRequestException(`Member with ID '${memberId}' is not active (current status: ${member.status})`);
        }
        const creatorId = actorId || createdBy || null;
        const entry = await this.prisma.repurchaseEntry.create({
            data: {
                transactionRef,
                memberId,
                amount: new client_1.Prisma.Decimal(amount),
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
    async findAll(query) {
        const { page = 1, limit = 10, memberId, search, startDate, endDate, sortBy = 'transactionDate', sortOrder = 'desc' } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (memberId) {
            where.memberId = memberId;
        }
        if (startDate || endDate) {
            where.transactionDate = {};
            if (startDate)
                where.transactionDate.gte = new Date(startDate);
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
    async findById(id) {
        const entry = await this.prisma.repurchaseEntry.findUnique({
            where: { id },
            include: {
                member: {
                    select: { id: true, memberCode: true, name: true, mobile: true, status: true },
                },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
        }
        return this.mapToResponseDto(entry);
    }
    async update(id, dto, actorId) {
        const existing = await this.prisma.repurchaseEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
        }
        const { transactionRef, memberId, amount, transactionDate, remarks } = dto;
        if (transactionRef && transactionRef !== existing.transactionRef) {
            const collision = await this.prisma.repurchaseEntry.findUnique({
                where: { transactionRef },
            });
            if (collision) {
                throw new common_1.ConflictException(`Transaction reference '${transactionRef}' is already taken`);
            }
        }
        if (memberId && memberId !== existing.memberId) {
            const member = await this.prisma.member.findUnique({ where: { id: memberId } });
            if (!member) {
                throw new common_1.NotFoundException(`Member with ID '${memberId}' does not exist`);
            }
            if (member.status !== client_1.MemberStatus.ACTIVE) {
                throw new common_1.BadRequestException(`Member with ID '${memberId}' is not active (current status: ${member.status})`);
            }
        }
        const updated = await this.prisma.repurchaseEntry.update({
            where: { id },
            data: {
                ...(transactionRef ? { transactionRef } : {}),
                ...(memberId ? { memberId } : {}),
                ...(amount ? { amount: new client_1.Prisma.Decimal(amount) } : {}),
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
    async remove(id, actorId) {
        const existing = await this.prisma.repurchaseEntry.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Repurchase entry with ID '${id}' not found`);
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
    mapToResponseDto(entry) {
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
};
exports.RepurchaseService = RepurchaseService;
exports.RepurchaseService = RepurchaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RepurchaseService);
//# sourceMappingURL=repurchase.service.js.map