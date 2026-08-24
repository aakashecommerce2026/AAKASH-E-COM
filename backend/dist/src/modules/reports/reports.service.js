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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    buildDateWhere(startDate, endDate) {
        if (!startDate && !endDate)
            return undefined;
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.lte = end;
        }
        return dateFilter;
    }
    async getAdminMembershipEarnings(query) {
        const { startDate, endDate, memberId, beneficiaryMemberId, sourceMemberId, level, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (level) {
            where.level = level;
        }
        if (status) {
            where.status = status;
        }
        if (beneficiaryMemberId) {
            where.beneficiaryMemberId = beneficiaryMemberId;
        }
        if (sourceMemberId) {
            where.sourceMemberId = sourceMemberId;
        }
        if (memberId && !beneficiaryMemberId && !sourceMemberId) {
            where.OR = [
                { sourceMemberId: memberId },
                { beneficiaryMemberId: memberId },
            ];
        }
        const validSortFields = ['createdAt', 'amount', 'level', 'status'];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, ledgers, summaryGroups] = await Promise.all([
            this.prisma.membershipCommissionLedger.count({ where }),
            this.prisma.membershipCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    sourceMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                    beneficiaryMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                },
            }),
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['status'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        let totalGrossAmount = 0;
        let pendingAmount = 0;
        let holdAmount = 0;
        let disbursedAmount = 0;
        let cancelledAmount = 0;
        summaryGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalGrossAmount += sum;
            if (g.status === client_1.CommissionStatus.PENDING)
                pendingAmount += sum;
            if (g.status === client_1.CommissionStatus.HOLD)
                holdAmount += sum;
            if (g.status === client_1.CommissionStatus.DISBURSED)
                disbursedAmount += sum;
            if (g.status === client_1.CommissionStatus.CANCELLED)
                cancelledAmount += sum;
        });
        const data = ledgers.map((l) => ({
            id: l.id,
            sourceMemberId: l.sourceMemberId,
            sourceMember: l.sourceMember,
            beneficiaryMemberId: l.beneficiaryMemberId,
            beneficiaryMember: l.beneficiaryMember,
            level: l.level,
            percentage: Number(l.percentage),
            amount: Number(l.amount),
            status: l.status,
            distributionRecordId: l.distributionRecordId,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
        }));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalGrossAmount,
                pendingAmount,
                holdAmount,
                disbursedAmount,
                cancelledAmount,
            },
        };
    }
    async getLevelWiseEarnings(query) {
        const { startDate, endDate, status } = query;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (status) {
            where.status = status;
        }
        const [totalsByLevel, statusBreakdown] = await Promise.all([
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['level'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['level', 'status'],
                where,
                _sum: { amount: true },
            }),
        ]);
        const totalsMap = new Map();
        totalsByLevel.forEach((g) => {
            totalsMap.set(g.level, {
                sum: Number(g._sum.amount ?? 0),
                count: g._count.id,
            });
        });
        const statusMap = new Map();
        statusBreakdown.forEach((g) => {
            const key = `${g.level}_${g.status}`;
            statusMap.set(key, Number(g._sum.amount ?? 0));
        });
        const result = Array.from({ length: 20 }, (_, i) => {
            const lvl = i + 1;
            const t = totalsMap.get(lvl) || { sum: 0, count: 0 };
            return {
                level: lvl,
                totalAmount: t.sum,
                totalCount: t.count,
                pendingAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.PENDING}`) || 0,
                holdAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.HOLD}`) || 0,
                disbursedAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.DISBURSED}`) || 0,
                cancelledAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.CANCELLED}`) || 0,
            };
        });
        return result;
    }
    async getMemberWiseEarnings(query) {
        const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (status) {
            where.status = status;
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            where.beneficiaryMember = {
                OR: [
                    { name: { contains: term, mode: 'insensitive' } },
                    { memberCode: { contains: term, mode: 'insensitive' } },
                    { mobile: { contains: term } },
                    { email: { contains: term, mode: 'insensitive' } },
                ],
            };
        }
        const groupedBeneficiaries = await this.prisma.membershipCommissionLedger.groupBy({
            by: ['beneficiaryMemberId'],
            where,
            _sum: { amount: true },
            _count: { id: true },
        });
        const totalMembers = groupedBeneficiaries.length;
        const skip = (page - 1) * limit;
        groupedBeneficiaries.sort((a, b) => Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0));
        const paginatedGroup = groupedBeneficiaries.slice(skip, skip + limit);
        const targetMemberIds = paginatedGroup.map((g) => g.beneficiaryMemberId);
        if (targetMemberIds.length === 0) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }
        const [members, memberStatusBreakdowns] = await Promise.all([
            this.prisma.member.findMany({
                where: { id: { in: targetMemberIds } },
                select: {
                    id: true,
                    memberCode: true,
                    name: true,
                    mobile: true,
                    email: true,
                    status: true,
                },
            }),
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['beneficiaryMemberId', 'status'],
                where: {
                    ...where,
                    beneficiaryMemberId: { in: targetMemberIds },
                },
                _sum: { amount: true },
            }),
        ]);
        const memberMap = new Map();
        members.forEach((m) => memberMap.set(m.id, m));
        const statusMap = new Map();
        memberStatusBreakdowns.forEach((g) => {
            const key = `${g.beneficiaryMemberId}_${g.status}`;
            statusMap.set(key, Number(g._sum.amount ?? 0));
        });
        const data = paginatedGroup.map((g) => {
            const mId = g.beneficiaryMemberId;
            const memberInfo = memberMap.get(mId);
            return {
                member: memberInfo || {
                    id: mId,
                    memberCode: 'UNKNOWN',
                    name: 'Unknown',
                },
                totalEarned: Number(g._sum.amount ?? 0),
                totalLedgers: g._count.id,
                pendingAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.PENDING}`) || 0,
                holdAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.HOLD}`) || 0,
                disbursedAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.DISBURSED}`) || 0,
                cancelledAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.CANCELLED}`) || 0,
            };
        });
        return {
            data,
            meta: {
                total: totalMembers,
                page,
                limit,
                totalPages: Math.ceil(totalMembers / limit),
            },
        };
    }
    async getMemberEarnings(loggedInUserId, query) {
        const member = await this.prisma.member.findUnique({
            where: { id: loggedInUserId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member account not found for ID '${loggedInUserId}'`);
        }
        const { startDate, endDate, level, status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            beneficiaryMemberId: loggedInUserId,
        };
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (level) {
            where.level = level;
        }
        if (status) {
            where.status = status;
        }
        const [total, ledgers, summaryGroups] = await Promise.all([
            this.prisma.membershipCommissionLedger.count({ where }),
            this.prisma.membershipCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sourceMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                },
            }),
            this.prisma.membershipCommissionLedger.groupBy({
                by: ['status'],
                where: { beneficiaryMemberId: loggedInUserId },
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        let totalEarned = 0;
        let pendingAmount = 0;
        let holdAmount = 0;
        let disbursedAmount = 0;
        let cancelledAmount = 0;
        summaryGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalEarned += sum;
            if (g.status === client_1.CommissionStatus.PENDING)
                pendingAmount += sum;
            if (g.status === client_1.CommissionStatus.HOLD)
                holdAmount += sum;
            if (g.status === client_1.CommissionStatus.DISBURSED)
                disbursedAmount += sum;
            if (g.status === client_1.CommissionStatus.CANCELLED)
                cancelledAmount += sum;
        });
        const data = ledgers.map((l) => ({
            id: l.id,
            sourceMemberId: l.sourceMemberId,
            sourceMember: l.sourceMember,
            beneficiaryMemberId: l.beneficiaryMemberId,
            level: l.level,
            percentage: Number(l.percentage),
            amount: Number(l.amount),
            status: l.status,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
        }));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalEarned,
                pendingAmount,
                holdAmount,
                disbursedAmount,
                cancelledAmount,
            },
        };
    }
    async getAdminRepurchaseEarnings(query) {
        const { startDate, endDate, memberId, beneficiaryMemberId, sourceMemberId, level, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', } = query;
        const skip = (page - 1) * limit;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (level) {
            where.level = level;
        }
        if (status) {
            where.status = status;
        }
        if (beneficiaryMemberId) {
            where.beneficiaryMemberId = beneficiaryMemberId;
        }
        if (sourceMemberId) {
            where.sourceMemberId = sourceMemberId;
        }
        if (memberId && !beneficiaryMemberId && !sourceMemberId) {
            where.OR = [
                { sourceMemberId: memberId },
                { beneficiaryMemberId: memberId },
            ];
        }
        const validSortFields = ['createdAt', 'amount', 'level', 'status'];
        const orderByField = validSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';
        const [total, ledgers, summaryGroups] = await Promise.all([
            this.prisma.repurchaseCommissionLedger.count({ where }),
            this.prisma.repurchaseCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [orderByField]: sortOrder },
                include: {
                    sourceMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                    beneficiaryMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                    repurchaseEntry: {
                        select: {
                            id: true,
                            transactionRef: true,
                            amount: true,
                            transactionDate: true,
                        },
                    },
                },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['status'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        let totalGrossAmount = 0;
        let pendingAmount = 0;
        let holdAmount = 0;
        let disbursedAmount = 0;
        let cancelledAmount = 0;
        summaryGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalGrossAmount += sum;
            if (g.status === client_1.CommissionStatus.PENDING)
                pendingAmount += sum;
            if (g.status === client_1.CommissionStatus.HOLD)
                holdAmount += sum;
            if (g.status === client_1.CommissionStatus.DISBURSED)
                disbursedAmount += sum;
            if (g.status === client_1.CommissionStatus.CANCELLED)
                cancelledAmount += sum;
        });
        const data = ledgers.map((l) => ({
            id: l.id,
            repurchaseEntryId: l.repurchaseEntryId,
            repurchaseEntry: l.repurchaseEntry
                ? {
                    ...l.repurchaseEntry,
                    amount: Number(l.repurchaseEntry.amount),
                }
                : undefined,
            sourceMemberId: l.sourceMemberId,
            sourceMember: l.sourceMember,
            beneficiaryMemberId: l.beneficiaryMemberId,
            beneficiaryMember: l.beneficiaryMember,
            level: l.level,
            percentage: Number(l.percentage),
            amount: Number(l.amount),
            status: l.status,
            distributionRecordId: l.distributionRecordId,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
        }));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalGrossAmount,
                pendingAmount,
                holdAmount,
                disbursedAmount,
                cancelledAmount,
            },
        };
    }
    async getLevelWiseRepurchaseEarnings(query) {
        const { startDate, endDate, status } = query;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (status) {
            where.status = status;
        }
        const [totalsByLevel, statusBreakdown] = await Promise.all([
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['level'],
                where,
                _sum: { amount: true },
                _count: { id: true },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['level', 'status'],
                where,
                _sum: { amount: true },
            }),
        ]);
        const totalsMap = new Map();
        totalsByLevel.forEach((g) => {
            totalsMap.set(g.level, {
                sum: Number(g._sum.amount ?? 0),
                count: g._count.id,
            });
        });
        const statusMap = new Map();
        statusBreakdown.forEach((g) => {
            const key = `${g.level}_${g.status}`;
            statusMap.set(key, Number(g._sum.amount ?? 0));
        });
        const result = Array.from({ length: 20 }, (_, i) => {
            const lvl = i + 1;
            const t = totalsMap.get(lvl) || { sum: 0, count: 0 };
            return {
                level: lvl,
                totalAmount: t.sum,
                totalCount: t.count,
                pendingAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.PENDING}`) || 0,
                holdAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.HOLD}`) || 0,
                disbursedAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.DISBURSED}`) || 0,
                cancelledAmount: statusMap.get(`${lvl}_${client_1.CommissionStatus.CANCELLED}`) || 0,
            };
        });
        return result;
    }
    async getMemberWiseRepurchaseEarnings(query) {
        const { startDate, endDate, status, search, page = 1, limit = 10 } = query;
        const where = {};
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (status) {
            where.status = status;
        }
        if (search && search.trim() !== '') {
            const term = search.trim();
            where.beneficiaryMember = {
                OR: [
                    { name: { contains: term, mode: 'insensitive' } },
                    { memberCode: { contains: term, mode: 'insensitive' } },
                    { mobile: { contains: term } },
                    { email: { contains: term, mode: 'insensitive' } },
                ],
            };
        }
        const groupedBeneficiaries = await this.prisma.repurchaseCommissionLedger.groupBy({
            by: ['beneficiaryMemberId'],
            where,
            _sum: { amount: true },
            _count: { id: true },
        });
        const totalMembers = groupedBeneficiaries.length;
        const skip = (page - 1) * limit;
        groupedBeneficiaries.sort((a, b) => Number(b._sum.amount ?? 0) - Number(a._sum.amount ?? 0));
        const paginatedGroup = groupedBeneficiaries.slice(skip, skip + limit);
        const targetMemberIds = paginatedGroup.map((g) => g.beneficiaryMemberId);
        if (targetMemberIds.length === 0) {
            return {
                data: [],
                meta: {
                    total: 0,
                    page,
                    limit,
                    totalPages: 0,
                },
            };
        }
        const [members, memberStatusBreakdowns] = await Promise.all([
            this.prisma.member.findMany({
                where: { id: { in: targetMemberIds } },
                select: {
                    id: true,
                    memberCode: true,
                    name: true,
                    mobile: true,
                    email: true,
                    status: true,
                },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['beneficiaryMemberId', 'status'],
                where: {
                    ...where,
                    beneficiaryMemberId: { in: targetMemberIds },
                },
                _sum: { amount: true },
            }),
        ]);
        const memberMap = new Map();
        members.forEach((m) => memberMap.set(m.id, m));
        const statusMap = new Map();
        memberStatusBreakdowns.forEach((g) => {
            const key = `${g.beneficiaryMemberId}_${g.status}`;
            statusMap.set(key, Number(g._sum.amount ?? 0));
        });
        const data = paginatedGroup.map((g) => {
            const mId = g.beneficiaryMemberId;
            const memberInfo = memberMap.get(mId);
            return {
                member: memberInfo || {
                    id: mId,
                    memberCode: 'UNKNOWN',
                    name: 'Unknown',
                },
                totalEarned: Number(g._sum.amount ?? 0),
                totalLedgers: g._count.id,
                pendingAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.PENDING}`) || 0,
                holdAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.HOLD}`) || 0,
                disbursedAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.DISBURSED}`) || 0,
                cancelledAmount: statusMap.get(`${mId}_${client_1.CommissionStatus.CANCELLED}`) || 0,
            };
        });
        return {
            data,
            meta: {
                total: totalMembers,
                page,
                limit,
                totalPages: Math.ceil(totalMembers / limit),
            },
        };
    }
    async getMemberRepurchaseEarnings(loggedInUserId, query) {
        const member = await this.prisma.member.findUnique({
            where: { id: loggedInUserId },
        });
        if (!member) {
            throw new common_1.NotFoundException(`Member account not found for ID '${loggedInUserId}'`);
        }
        const { startDate, endDate, level, status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;
        const where = {
            beneficiaryMemberId: loggedInUserId,
        };
        const createdAtFilter = this.buildDateWhere(startDate, endDate);
        if (createdAtFilter) {
            where.createdAt = createdAtFilter;
        }
        if (level) {
            where.level = level;
        }
        if (status) {
            where.status = status;
        }
        const [total, ledgers, summaryGroups] = await Promise.all([
            this.prisma.repurchaseCommissionLedger.count({ where }),
            this.prisma.repurchaseCommissionLedger.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    sourceMember: {
                        select: { id: true, memberCode: true, name: true, mobile: true },
                    },
                    repurchaseEntry: {
                        select: {
                            id: true,
                            transactionRef: true,
                            amount: true,
                            transactionDate: true,
                        },
                    },
                },
            }),
            this.prisma.repurchaseCommissionLedger.groupBy({
                by: ['status'],
                where: { beneficiaryMemberId: loggedInUserId },
                _sum: { amount: true },
                _count: { id: true },
            }),
        ]);
        let totalEarned = 0;
        let pendingAmount = 0;
        let holdAmount = 0;
        let disbursedAmount = 0;
        let cancelledAmount = 0;
        summaryGroups.forEach((g) => {
            const sum = Number(g._sum.amount ?? 0);
            totalEarned += sum;
            if (g.status === client_1.CommissionStatus.PENDING)
                pendingAmount += sum;
            if (g.status === client_1.CommissionStatus.HOLD)
                holdAmount += sum;
            if (g.status === client_1.CommissionStatus.DISBURSED)
                disbursedAmount += sum;
            if (g.status === client_1.CommissionStatus.CANCELLED)
                cancelledAmount += sum;
        });
        const data = ledgers.map((l) => ({
            id: l.id,
            repurchaseEntryId: l.repurchaseEntryId,
            repurchaseEntry: l.repurchaseEntry
                ? {
                    ...l.repurchaseEntry,
                    amount: Number(l.repurchaseEntry.amount),
                }
                : undefined,
            sourceMemberId: l.sourceMemberId,
            sourceMember: l.sourceMember,
            beneficiaryMemberId: l.beneficiaryMemberId,
            level: l.level,
            percentage: Number(l.percentage),
            amount: Number(l.amount),
            status: l.status,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
        }));
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
            summary: {
                totalEarned,
                pendingAmount,
                holdAmount,
                disbursedAmount,
                cancelledAmount,
            },
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map