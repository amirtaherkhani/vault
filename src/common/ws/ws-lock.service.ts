import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { LoggerService } from '../logger/logger.service';
import { AllConfigType } from '../../config/config.type';

/**
 * Lightweight distributed lock used by the WebSocket layer so only one pod
 * owns an upstream connection at a time (K8s horizontal scaling).
 *
 * Lock semantics:
 * - set NX with TTL
 * - renew via pexpire only if value matches instanceId
 * - release via Lua (delete-if-equals)
 */
@Injectable()
export class WsLockService implements OnModuleDestroy {
  readonly enabled: boolean;
  readonly ttlMs: number;
  readonly renewEveryMs: number;
  readonly retryDelayMs: number;
  private readonly keyPrefix: string;
  private readonly instanceId: string;
  private redis: Redis | null = null;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    const cfg = this.configService.get('ws', { infer: true });

    const url =
      cfg?.lockRedisUrl ??
      process.env.WS_LOCK_REDIS_URL ??
      process.env.CACHE_REDIS_URL ??
      process.env.INTERNAL_EVENTS_REDIS_URL;

    const enabledFlag =
      cfg?.lockEnable ??
      (process.env.WS_LOCK_ENABLE === undefined
        ? true
        : ['1', 'true', 'yes'].includes(
            String(process.env.WS_LOCK_ENABLE).toLowerCase(),
          ));

    this.enabled = enabledFlag && Boolean(url);
    this.ttlMs = cfg?.lockTtlMs ?? Number(process.env.WS_LOCK_TTL_MS ?? 15_000);
    this.renewEveryMs = Math.floor(this.ttlMs * 0.6);
    this.retryDelayMs = Math.floor(this.ttlMs * 0.4);
    this.keyPrefix =
      cfg?.lockKeyPrefix ?? process.env.WS_LOCK_KEY_PREFIX ?? 'ws-lock:';
    this.instanceId = process.env.HOSTNAME || randomUUID();

    if (this.enabled && url) {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
      });
      this.logger.log(
        `WS lock enabled (ttl=${this.ttlMs}ms, prefix=${this.keyPrefix}) using ${url}`,
        WsLockService.name,
      );
    } else {
      this.logger.warn(
        'WS lock disabled (missing redis URL or WS_LOCK_ENABLE=false).',
        WsLockService.name,
      );
    }
  }

  async tryAcquire(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return true; // treat as success when disabled
    const k = this.keyPrefix + key;
    const res = await this.redis.set(
      k,
      this.instanceId,
      'PX',
      this.ttlMs,
      'NX',
    );
    return res === 'OK';
  }

  async renew(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) return true;
    const k = this.keyPrefix + key;
    // Lua: if value matches, pexpire, return 1 else 0
    const script =
      'if redis.call(\"get\", KEYS[1]) == ARGV[1] then return redis.call(\"pexpire\", KEYS[1], ARGV[2]) else return 0 end';
    const res = await this.redis.eval(
      script,
      1,
      k,
      this.instanceId,
      this.ttlMs,
    );
    return Number(res) === 1;
  }

  async release(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return;
    const k = this.keyPrefix + key;
    const script =
      'if redis.call(\"get\", KEYS[1]) == ARGV[1] then return redis.call(\"del\", KEYS[1]) else return 0 end';
    try {
      await this.redis.eval(script, 1, k, this.instanceId);
    } catch (err) {
      this.logger.debug(
        `WS lock release error for ${k}: ${(err as Error)?.message ?? err}`,
        WsLockService.name,
      );
    }
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}
