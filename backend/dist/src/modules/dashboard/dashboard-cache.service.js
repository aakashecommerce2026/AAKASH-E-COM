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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DashboardCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardCacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let DashboardCacheService = DashboardCacheService_1 = class DashboardCacheService {
    configService;
    logger = new common_1.Logger(DashboardCacheService_1.name);
    redisClient = null;
    isRedisConnected = false;
    memoryCache = new Map();
    constructor(configService) {
        this.configService = configService;
        this.initRedis();
    }
    initRedis() {
        if (process.env.NODE_ENV === 'test') {
            return;
        }
        const host = this.configService.get('REDIS_HOST') || 'localhost';
        const port = this.configService.get('REDIS_PORT') || 6379;
        const password = this.configService.get('REDIS_PASSWORD');
        try {
            this.redisClient = new ioredis_1.default({
                host,
                port,
                password,
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableOfflineQueue: false,
                connectTimeout: 2000,
            });
            this.redisClient.on('connect', () => {
                this.isRedisConnected = true;
                this.logger.log(`DashboardCacheService connected to Redis at ${host}:${port}`);
            });
            this.redisClient.on('error', (err) => {
                this.isRedisConnected = false;
                this.logger.debug(`Redis cache unavailable (${err.message}). Using in-memory cache.`);
            });
            this.redisClient.connect().catch((err) => {
                this.isRedisConnected = false;
                this.logger.debug(`Redis initial connect failed (${err.message}). Using in-memory cache fallback.`);
            });
        }
        catch (err) {
            this.isRedisConnected = false;
            this.logger.debug(`Redis client creation failed (${err?.message}). Using in-memory cache.`);
        }
    }
    async get(key) {
        if (this.isRedisConnected && this.redisClient) {
            try {
                const val = await this.redisClient.get(key);
                if (val) {
                    return JSON.parse(val);
                }
            }
            catch (err) {
                this.isRedisConnected = false;
            }
        }
        const entry = this.memoryCache.get(key);
        if (entry) {
            if (Date.now() < entry.expiresAt) {
                return entry.value;
            }
            this.memoryCache.delete(key);
        }
        return null;
    }
    async set(key, value, ttlSeconds = 60) {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        this.memoryCache.set(key, { value, expiresAt });
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
            }
            catch (err) {
                this.isRedisConnected = false;
            }
        }
    }
    async del(key) {
        this.memoryCache.delete(key);
        if (this.isRedisConnected && this.redisClient) {
            try {
                await this.redisClient.del(key);
            }
            catch (err) {
                this.isRedisConnected = false;
            }
        }
    }
    async clearByPatterns(prefixes) {
        for (const key of this.memoryCache.keys()) {
            if (prefixes.some((prefix) => key.startsWith(prefix.replace('*', '')))) {
                this.memoryCache.delete(key);
            }
        }
        if (this.isRedisConnected && this.redisClient) {
            try {
                for (const pattern of prefixes) {
                    const keys = await this.redisClient.keys(pattern);
                    if (keys.length > 0) {
                        await this.redisClient.del(...keys);
                    }
                }
            }
            catch (err) {
                this.isRedisConnected = false;
            }
        }
    }
    async invalidateMemberCache() {
        this.logger.log('Invalidating member, business, and activity dashboard caches');
        await this.clearByPatterns([
            'admin:dashboard:members:*',
            'admin:dashboard:business:*',
            'admin:dashboard:activity:*',
        ]);
    }
    async invalidateRepurchaseCache() {
        this.logger.log('Invalidating earnings, business, and activity dashboard caches');
        await this.clearByPatterns([
            'admin:dashboard:earnings:*',
            'admin:dashboard:business:*',
            'admin:dashboard:activity:*',
        ]);
    }
    async invalidateDistributionCache() {
        this.logger.log('Invalidating earnings, business, and activity dashboard caches');
        await this.clearByPatterns([
            'admin:dashboard:earnings:*',
            'admin:dashboard:business:*',
            'admin:dashboard:activity:*',
        ]);
    }
    async clearDashboardCache() {
        this.memoryCache.clear();
        if (this.isRedisConnected && this.redisClient) {
            try {
                const keys = await this.redisClient.keys('admin:dashboard:*');
                if (keys.length > 0) {
                    await this.redisClient.del(...keys);
                }
            }
            catch (err) {
                this.isRedisConnected = false;
            }
        }
    }
    onModuleDestroy() {
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
    }
};
exports.DashboardCacheService = DashboardCacheService;
exports.DashboardCacheService = DashboardCacheService = DashboardCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DashboardCacheService);
//# sourceMappingURL=dashboard-cache.service.js.map