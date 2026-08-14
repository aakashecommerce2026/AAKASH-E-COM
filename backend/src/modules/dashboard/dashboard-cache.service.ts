import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry {
  value: any;
  expiresAt: number;
}

@Injectable()
export class DashboardCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(DashboardCacheService.name);
  private redisClient: Redis | null = null;
  private isRedisConnected = false;
  private memoryCache = new Map<string, CacheEntry>();

  constructor(private readonly configService: ConfigService) {
    this.initRedis();
  }

  private initRedis() {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');

    try {
      this.redisClient = new Redis({
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

      // Non-blocking connection attempt
      this.redisClient.connect().catch((err) => {
        this.isRedisConnected = false;
        this.logger.debug(`Redis initial connect failed (${err.message}). Using in-memory cache fallback.`);
      });
    } catch (err: any) {
      this.isRedisConnected = false;
      this.logger.debug(`Redis client creation failed (${err?.message}). Using in-memory cache.`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        if (val) {
          return JSON.parse(val) as T;
        }
      } catch (err) {
        this.isRedisConnected = false;
      }
    }

    // Memory cache fallback
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return entry.value as T;
      }
      this.memoryCache.delete(key);
    }

    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 60): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });

    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      } catch (err) {
        this.isRedisConnected = false;
      }
    }
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isRedisConnected && this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (err) {
        this.isRedisConnected = false;
      }
    }
  }

  async clearDashboardCache(): Promise<void> {
    this.memoryCache.clear();
    if (this.isRedisConnected && this.redisClient) {
      try {
        const keys = await this.redisClient.keys('admin:dashboard:*');
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      } catch (err) {
        this.isRedisConnected = false;
      }
    }
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }
}
