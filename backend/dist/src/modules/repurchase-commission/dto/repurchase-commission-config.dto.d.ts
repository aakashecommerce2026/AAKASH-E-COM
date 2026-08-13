export declare class RepurchaseCommissionLevelRateDto {
    level: number;
    percentage: number;
    description?: string;
}
export declare class UpdateRepurchaseCommissionConfigDto {
    rates: RepurchaseCommissionLevelRateDto[];
}
export declare class RepurchaseCommissionConfigResponseDto {
    id: string;
    version: number;
    level: number;
    percentage: number;
    isActive: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
