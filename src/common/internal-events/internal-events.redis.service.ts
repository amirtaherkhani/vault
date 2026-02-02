import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  INTERNAL_EVENTS_DEFAULT_ENABLE,
  INTERNAL_EVENTS_DEFAULT_REDIS_MAX_RETRIES_PER_REQUEST,
  INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_MAX_MS,
  INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_STEP_MS,
} from './types/internal-events-const.type';
import { LoggerService } from '../logger/logger.service';
import { AllConfigType } from '../../config/config.type';
import { ConfigGet, ConfigGetOrThrow } from '../../config/config.decorator';
import { BaseToggleableService } from '../base/base-toggleable.service';

@Injectable()
export class InternalEventsRedisService
  extends BaseToggleableService
  implements OnModuleDestroy, OnModuleInit
{
  private readonly client: Redis;
  private isConnected = false;
  private lastErrorMessage = '';
  private lastErrorAt = 0;
  private suppressedErrors = 0;
  private lastReconnectLogAt = 0;

  @ConfigGetOrThrow('internalEvents.redisUrl', {
    inferEnvVar: true,
  })
  private readonly redisUrl!: string;

  @ConfigGet('internalEvents.redisRetryStepMs', {
    inferEnvVar: true,
    defaultValue: INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_STEP_MS,
  })
  private readonly redisRetryStepMs!: number;

  @ConfigGet('internalEvents.redisRetryMaxMs', {
    inferEnvVar: true,
    defaultValue: INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_MAX_MS,
  })
  private readonly redisRetryMaxMs!: number;

  @ConfigGet('internalEvents.redisMaxRetriesPerRequest', {
    inferEnvVar: true,
    defaultValue: INTERNAL_EVENTS_DEFAULT_REDIS_MAX_RETRIES_PER_REQUEST,
  })
  private readonly redisMaxRetriesPerRequest!: number;

  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super(
      InternalEventsRedisService.name,
      configService.get(
        'internalEvents.enable',
        INTERNAL_EVENTS_DEFAULT_ENABLE,
        { infer: true },
      ),
    );
    this.loggerService.debug(
      `Internal events Redis retry configured step=${this.redisRetryStepMs}ms max=${this.redisRetryMaxMs}ms`,
      InternalEventsRedisService.name,
    );
    this.client = new Redis(this.redisUrl, {
      // Delay connection until listeners are attached to avoid unhandled errors
      lazyConnect: true,
      // -1 means unlimited retries per request (ioredis expects null).
      maxRetriesPerRequest:
        this.redisMaxRetriesPerRequest < 0
          ? null
          : this.redisMaxRetriesPerRequest,
      // Reconnect cadence driven by env-configured step/max (capped by max)
      retryStrategy: (times) => {
        const stepMs = Math.max(this.redisRetryStepMs, 1_000);
        const maxMs = Math.max(this.redisRetryMaxMs, stepMs);
        return Math.min(times * stepMs, maxMs);
      },
    });
    this.client.on('ready', () => {
      this.isConnected = true;
      this.loggerService.log(
        `Internal events Redis client ready (url=${this.redisUrl})`,
        InternalEventsRedisService.name,
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
          `Internal events Redis error repeated ${this.suppressedErrors} times (suppressed).`,
          InternalEventsRedisService.name,
        );
        this.suppressedErrors = 0;
      }
      this.lastErrorMessage = message;
      this.lastErrorAt = now;
      this.loggerService.error(
        `Internal events Redis error: ${this.formatFriendlyError(err)}`,
        undefined,
        InternalEventsRedisService.name,
      );
    });
    this.client.on('end', () => {
      this.isConnected = false;
      this.loggerService.warn(
        'Internal events Redis connection closed',
        InternalEventsRedisService.name,
      );
    });
    this.client.on('reconnecting', (delay) => {
      const now = Date.now();
      if (now - this.lastReconnectLogAt >= 60_000) {
        this.lastReconnectLogAt = now;
        this.loggerService.debug(
          `Internal events Redis reconnecting in ${delay}ms`,
          InternalEventsRedisService.name,
        );
      }
    });
    this.loggerService.debug(
      'Internal events Redis client initialized',
      InternalEventsRedisService.name,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.loggerService.warn(
        'Internal events are disabled; Redis client will not connect.',
        InternalEventsRedisService.name,
      );
      return;
    }
    if (this.client.status === 'ready') {
      await this.checkConnection();
      return;
    }
    this.loggerService.log(
      `Connecting to internal events Redis at ${this.redisUrl}`,
      InternalEventsRedisService.name,
    );
    try {
      await this.client.connect();
      this.loggerService.log(
        `Internal events Redis initial connection established (url=${this.redisUrl})`,
        InternalEventsRedisService.name,
      );
    } catch (err) {
      this.loggerService.error(
        `Internal events Redis initial connect failed: ${this.formatFriendlyError(err)}`,
        undefined,
        InternalEventsRedisService.name,
      );
      return;
    }
    await this.checkConnection();
  }

  /** Returns true when the service is enabled and the Redis client is connected. */
  public isReady(): boolean {
    return this.isEnabled && this.isConnected;
  }

  getClient(): Redis {
    return this.client;
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.client.ping();
      this.loggerService.log(
        'Internal events Redis connection is OK.',
        InternalEventsRedisService.name,
      );
    } catch (e: any) {
      this.loggerService.warn(
        `Internal events Redis connectivity check failed: ${e?.message || e}`,
        InternalEventsRedisService.name,
      );
    }
  }

  private formatFriendlyError(err: Error | undefined): string {
    if (!err) {
      return 'Unknown Redis error';
    }
    const code = (err as any)?.code as string | undefined;
    const hostname = this.safeRedisHost();

    if (code === 'ENOTFOUND') {
      return `Redis host could not be resolved (host=${hostname ?? 'unknown'}, url=${this.redisUrl}). Check INTERNAL_EVENTS_REDIS_URL.`;
    }
    if (code === 'ECONNREFUSED') {
      return `Redis refused the connection (host=${hostname ?? 'unknown'}, url=${this.redisUrl}). Ensure Redis is reachable.`;
    }

    const base = err.message ?? 'Unknown Redis error';
    return code ? `${base} (code=${code})` : base;
  }

  private safeRedisHost(): string | undefined {
    try {
      return new URL(this.redisUrl).hostname;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return undefined;
    }
  }

  async onModuleDestroy() {
    this.loggerService.debug(
      'Closing internal events Redis client',
      InternalEventsRedisService.name,
    );
    await this.client.quit();
  }
}
