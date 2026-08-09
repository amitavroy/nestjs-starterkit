import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CachePutConfig } from './cache.types';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly enabled: boolean;
  private readonly keyPrefix: string;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled = !!this.configService.getOrThrow<string>('redis.url');
    this.keyPrefix = this.configService.getOrThrow<string>('redis.keyPrefix');
    this.defaultTtl = this.configService.getOrThrow<number>('redis.defaultTtlSeconds');
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const redisUrl = this.configService.getOrThrow<string>('redis.url');
      this.redis = new Redis(redisUrl);
      this.logger.log('Cache service connected to Redis');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      this.redis = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
      this.logger.log('Cache service disconnected from Redis');
    }
  }

  async cacheGet<T>({ key }: { key: string }): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const data = await this.redis.get(prefixedKey);
      if (!data) {
        return null;
      }
      return JSON.parse(data) as T;
    } catch (error) {
      this.logger.warn(`Cache get error for key "${key}":`, error);
      return null;
    }
  }

  async cachePut<T>({
    key,
    data,
    config,
  }: {
    key: string;
    data: T;
    config?: CachePutConfig;
  }): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      const ttl = config?.expirySeconds ?? this.defaultTtl;
      const serialized = JSON.stringify(data);
      await this.redis.setex(prefixedKey, ttl, serialized);
    } catch (error) {
      this.logger.warn(`Cache put error for key "${key}":`, error);
    }
  }

  async cacheForget({ key }: { key: string }): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const prefixedKey = this.getPrefixedKey(key);
      await this.redis.del(prefixedKey);
    } catch (error) {
      this.logger.warn(`Cache forget error for key "${key}":`, error);
    }
  }

  private getPrefixedKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}
