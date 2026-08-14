import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class DashboardCacheService implements OnModuleDestroy {
    private readonly configService;
    private readonly logger;
    private redisClient;
    private isRedisConnected;
    private memoryCache;
    constructor(configService: ConfigService);
    private initRedis;
    get<T = any>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    clearByPatterns(prefixes: string[]): Promise<void>;
    invalidateMemberCache(): Promise<void>;
    invalidateRepurchaseCache(): Promise<void>;
    invalidateDistributionCache(): Promise<void>;
    clearDashboardCache(): Promise<void>;
    onModuleDestroy(): void;
}
