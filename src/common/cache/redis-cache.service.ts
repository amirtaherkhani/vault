import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import Redlock from 'redlock';
import { AllConfigType } from '../../config/config.type';
import { LoggerService } from '../logger/logger.service';
import { CacheConfig } from './config/cache-config.type';
import { CacheStoredEntry } from './cache.types';
import { deserializeCacheEntry, serializeCacheEntry } from './cache.serializer';
import { CacheLogger } from './cache.logger';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private client?: Redis;
  private redlock?: Redlock;
  private config: CacheConfig;
  private lastErrorMessage = '';
  private lastErrorAt = 0;
  private suppressedErrors = 0;
  private lastReconnectLogAt = 0;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly cacheLogger: CacheLogger,
    private readonly loggerService: LoggerService,
  ) {
    this.config = this.configService.get('cache', {
      infer: true,
    }) as CacheConfig;
  }

  onModuleInit() {
    if (!this.config.enable) {
      this.loggerService.debug(
        'Cache disabled; Redis cache client not started',
        RedisCacheService.name,
      );
      return;
    }
    this.loggerService.log(
      `Connecting to cache Redis at ${this.config.redisUrl}`,
      RedisCacheService.name,
    );
    this.loggerService.debug(
      `Cache config: prefix=${this.config.keyPrefix} ttl=${this.config.defaultTtlSeconds}s scope=${this.config.defaultScope} strategy=${this.config.defaultKeyStrategy} metrics=${this.config.metricsEnable}`,
      RedisCacheService.name,
    );
    this.client = new Redis(this.config.redisUrl, {
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
    this.client.on('ready', () => {
      this.loggerService.log(
        `Cache Redis client ready (url=${this.config.redisUrl})`,
        RedisCacheService.name,
      );
    });
    this.client.on('error', (err) => {
      const now = Date.now();
      const message = err?.message ?? 'Redis error';
      const sameAsLast = message === this.lastErrorMessage;
      const withinWindow = now - this.lastErrorAt < 30_000;
      if (sameAsLast && withinWindow) {
        this.suppressedErrors += 1;
        return;
      }
      if (this.suppressedErrors > 0) {
        this.loggerService.warn(
          `Cache Redis error repeated ${this.suppressedErrors} times (suppressed).`,
          RedisCacheService.name,
        );
        this.suppressedErrors = 0;
      }
      this.lastErrorMessage = message;
      this.lastErrorAt = now;
      this.loggerService.error(
        `Cache Redis error: ${this.formatFriendlyError(err)}`,
        undefined,
        RedisCacheService.name,
      );
    });
    this.client.on('end', () => {
      this.loggerService.warn(
        'Cache Redis connection closed',
        RedisCacheService.name,
      );
    });
    this.client.on('reconnecting', (delay) => {
      const now = Date.now();
      if (now - this.lastReconnectLogAt >= 60_000) {
        this.lastReconnectLogAt = now;
        this.loggerService.debug(
          `Cache Redis reconnecting in ${delay}ms`,
          RedisCacheService.name,
        );
      }
    });
    this.redlock = new Redlock([this.client], {
      retryCount: this.config.lockRetryCount,
      retryDelay: this.config.lockRetryDelayMs,
      retryJitter: this.config.lockRetryJitterMs,
    });
  }

  async onModuleDestroy() {
    this.loggerService.debug(
      'Closing cache Redis client',
      RedisCacheService.name,
    );
    await this.client?.quit();
  }

  isEnabled(): boolean {
    return this.config.enable;
  }

  getKeyPrefix(): string {
    return this.config.keyPrefix;
  }

  async ping(): Promise<boolean> {
    if (!this.client || !this.config.enable) {
      return false;
    }
    const response = await this.client.ping();
    return response === 'PONG';
  }

  async get<T>(key: string): Promise<CacheStoredEntry<T> | null> {
    if (!this.client || !this.config.enable) {
      return null;
    }
    const raw = await this.client.get(key);
    return deserializeCacheEntry<T>(raw);
  }

  async set<T>(key: string, value: CacheStoredEntry<T>, ttlSeconds: number) {
    if (!this.client || !this.config.enable) {
      return;
    }
    const payload = serializeCacheEntry(value);
    await this.client.set(key, payload, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.config.enable) {
      return;
    }
    await this.client.del(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.client || !this.config.enable) {
      return;
    }
    const stream = this.client.scanStream({ match: pattern });
    const keys: string[] = [];
    for await (const chunk of stream) {
      keys.push(...chunk);
    }
    if (keys.length) {
      await this.client.del(...keys);
    }
  }

  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.client || !this.config.enable) {
      return keys.map(() => null);
    }
    return this.client.mget(...keys);
  }

  async setTags(key: string, tags: string[]): Promise<void> {
    if (!this.client || !this.config.enable || tags.length === 0) {
      return;
    }
    const pipeline = this.client.pipeline();
    tags.forEach((tag) => {
      pipeline.sadd(this.tagKey(tag), key);
    });
    await pipeline.exec();
  }

  async evictTags(tags: string[]): Promise<void> {
    if (!this.client || !this.config.enable || tags.length === 0) {
      return;
    }
    const pipeline = this.client.pipeline();
    for (const tag of tags) {
      const tagKey = this.tagKey(tag);
      const keys = await this.client.smembers(tagKey);
      if (keys.length) {
        pipeline.del(...keys);
      }
      pipeline.del(tagKey);
    }
    await pipeline.exec();
  }

  async withLock<T>(key: string, work: () => Promise<T>): Promise<T> {
    if (!this.redlock) {
      return work();
    }
    const lockKey = `${key}:lock`;
    const lock = await this.redlock.acquire([lockKey], this.config.lockTtlMs);
    try {
      return await work();
    } finally {
      await lock.release().catch((err) => {
        this.cacheLogger.error('Failed to release cache lock', err);
      });
    }
  }

  private tagKey(tag: string): string {
    return `${this.config.keyPrefix}:tag:${tag}`;
  }

  private formatFriendlyError(err: Error | undefined): string {
    if (!err) {
      return 'Unknown Redis error';
    }
    const code = (err as any)?.code as string | undefined;
    const hostname = this.safeRedisHost();
    if (code === 'ENOTFOUND') {
      return `Redis host could not be resolved (host=${hostname ?? 'unknown'}, url=${this.config.redisUrl}). Check CACHE_REDIS_URL.`;
    }
    if (code === 'ECONNREFUSED') {
      return `Redis refused the connection (host=${hostname ?? 'unknown'}, url=${this.config.redisUrl}). Ensure Redis is reachable.`;
    }
    const base = err.message ?? 'Unknown Redis error';
    return code ? `${base} (code=${code})` : base;
  }

  private safeRedisHost(): string | undefined {
    try {
      return new URL(this.config.redisUrl).hostname;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return undefined;
    }
  }
}
