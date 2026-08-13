export declare class LevelRateDto {
    level: number;
    percentage: number;
    description?: string;
}
export declare class CreateCommissionConfigDto {
    version: number;
    rates: LevelRateDto[];
    isActive?: boolean;
}
export declare class MembershipCommissionConfigResponseDto {
    id: string;
    version: number;
    level: number;
    percentage: number | string;
    isActive: boolean;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
