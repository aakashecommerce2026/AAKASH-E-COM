import type { Queue } from 'bull';
import type { Response } from 'express';
import { AdminReportsService, PeriodType } from './admin-reports.service';
import { PdfExportService } from './pdf-export.service';
import { ExcelExportService } from './excel-export.service';
import { QueryPeriodReportDto } from './dto/query-period-report.dto';
export declare class AdminReportsController {
    private readonly adminReportsService;
    private readonly pdfExportService;
    private readonly excelExportService;
    private readonly exportQueue?;
    private readonly exportsDir;
    constructor(adminReportsService: AdminReportsService, pdfExportService: PdfExportService, excelExportService: ExcelExportService, exportQueue?: Queue | undefined);
    getDailyReport(query: QueryPeriodReportDto): Promise<{
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            statusBreakdown: Record<string, number>;
        };
        trend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        data: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
            referrer: {
                id: string;
                memberCode: string;
                name: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalOrders: number;
            totalVolume: number;
            averageOrderValue: number;
            totalCommissionGenerated: number;
        };
        trend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        data: {
            id: string;
            transactionRef: string;
            memberId: string;
            member: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            amount: number;
            transactionDate: Date;
            remarks: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalMembershipEarnings: number;
            totalRepurchaseEarnings: number;
            totalEarnings: number;
            totalGrossDistributed: number;
            totalNetDistributed: number;
            totalTdsDeducted: number;
            totalAdminFeeDeducted: number;
        };
        trend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            activeRegistrations: number;
            repurchaseOrders: number;
            repurchaseVolume: number;
            averageOrderValue: number;
            totalEarningsGenerated: number;
            totalDistributed: number;
            payoutRatioPercentage: number;
        };
        registrationsTrend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        repurchaseTrend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        earningsTrend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    }>;
    getWeeklyReport(query: QueryPeriodReportDto): Promise<{
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            statusBreakdown: Record<string, number>;
        };
        trend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        data: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
            referrer: {
                id: string;
                memberCode: string;
                name: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalOrders: number;
            totalVolume: number;
            averageOrderValue: number;
            totalCommissionGenerated: number;
        };
        trend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        data: {
            id: string;
            transactionRef: string;
            memberId: string;
            member: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            amount: number;
            transactionDate: Date;
            remarks: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalMembershipEarnings: number;
            totalRepurchaseEarnings: number;
            totalEarnings: number;
            totalGrossDistributed: number;
            totalNetDistributed: number;
            totalTdsDeducted: number;
            totalAdminFeeDeducted: number;
        };
        trend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            activeRegistrations: number;
            repurchaseOrders: number;
            repurchaseVolume: number;
            averageOrderValue: number;
            totalEarningsGenerated: number;
            totalDistributed: number;
            payoutRatioPercentage: number;
        };
        registrationsTrend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        repurchaseTrend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        earningsTrend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    }>;
    getMonthlyReport(query: QueryPeriodReportDto): Promise<{
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            statusBreakdown: Record<string, number>;
        };
        trend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        data: {
            id: string;
            memberCode: string;
            name: string;
            mobile: string;
            email: string | null;
            joiningDate: Date;
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
            referrer: {
                id: string;
                memberCode: string;
                name: string;
            } | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalOrders: number;
            totalVolume: number;
            averageOrderValue: number;
            totalCommissionGenerated: number;
        };
        trend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        data: {
            id: string;
            transactionRef: string;
            memberId: string;
            member: {
                id: string;
                memberCode: string;
                name: string;
                mobile: string;
            };
            amount: number;
            transactionDate: Date;
            remarks: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalMembershipEarnings: number;
            totalRepurchaseEarnings: number;
            totalEarnings: number;
            totalGrossDistributed: number;
            totalNetDistributed: number;
            totalTdsDeducted: number;
            totalAdminFeeDeducted: number;
        };
        trend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    } | {
        periodType: PeriodType;
        dateRange: {
            startDate: string;
            endDate: string;
        };
        summary: {
            totalRegistrations: number;
            activeRegistrations: number;
            repurchaseOrders: number;
            repurchaseVolume: number;
            averageOrderValue: number;
            totalEarningsGenerated: number;
            totalDistributed: number;
            payoutRatioPercentage: number;
        };
        registrationsTrend: {
            period: string;
            totalRegistrations: number;
            activeCount: number;
            pendingCount: number;
        }[];
        repurchaseTrend: {
            period: string;
            orderCount: number;
            totalVolume: number;
            averageOrderValue: number;
        }[];
        earningsTrend: {
            period: string;
            membershipEarnings: number;
            repurchaseEarnings: number;
            totalEarnings: number;
        }[];
        calculatedAt: string;
    }>;
    exportPdf(query: QueryPeriodReportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    exportExcel(query: QueryPeriodReportDto, res: Response): Promise<Response<any, Record<string, any>>>;
    getExportStatus(jobId: string): Promise<{
        jobId: string;
        status: string;
        message: string;
        progress?: undefined;
        result?: undefined;
        failedReason?: undefined;
    } | {
        jobId: string;
        status: import("bull").JobStatus | "stuck";
        progress: any;
        result: any;
        failedReason: string | null;
        message?: undefined;
    }>;
    downloadExportFile(filename: string, res: Response): Promise<void>;
    private handleAsyncExport;
}
