import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommissionStatus, Prisma } from '@prisma/client';
import { CreateCommissionConfigDto, MembershipCommissionConfigResponseDto } from './dto/membership-commission-config.dto';
import { QueryMembershipCommissionDto } from './dto/query-membership-commission.dto';
import { MembershipCommissionResponseDto } from './dto/membership-commission-response.dto';
export declare const DEFAULT_20_LEVEL_RATES: {
    level: number;
    percentage: number;
    description: string;
}[];
export declare class MembershipCommissionService {
    private readonly prisma;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, auditService: AuditService);
    getActiveConfig(version?: number): Promise<MembershipCommissionConfigResponseDto[]>;
    publishConfigVersion(dto: CreateCommissionConfigDto, actorId?: string): Promise<MembershipCommissionConfigResponseDto[]>;
    processRegistrationCommissions(sourceMemberId: string, packageAmount?: number, txClient?: Prisma.TransactionClient): Promise<MembershipCommissionResponseDto[]>;
    findAll(query: QueryMembershipCommissionDto): Promise<{
        data: {
            sourceMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            beneficiaryMember: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            id: string;
            sourceMemberId: string;
            beneficiaryMemberId: string;
            level: number;
            percentage: number | string;
            amount: number | string;
            status: CommissionStatus;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<MembershipCommissionResponseDto>;
    private mapLedgerToDto;
}
