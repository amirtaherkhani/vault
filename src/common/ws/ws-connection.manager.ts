import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { randomUUID } from 'crypto';
import { LoggerService } from '../logger/logger.service';
import {
  WsConnectionMetrics,
  WsConnectionOptions,
  WsPingOptions,
  WsReconnectOptions,
  WsSubscriberHandlers,
  WsSubscription,
} from './types/ws-client.types';
import { WsLockService } from './ws-lock.service';
import { AllConfigType } from '../../config/config.type';

type ConnectionTimers = {
  ping?: NodeJS.Timeout;
  reconnect?: NodeJS.Timeout;
  lock?: NodeJS.Timeout;
  lockAttempt?: NodeJS.Timeout;
};

type ConnectionState = {
  key: string;
  url: string;
  options: ResolvedConnectionOptions;
  ws: WebSocket | null;
  subscribers: Map<string, WsSubscriberHandlers>;
  reconnectAttempts: number;
  timers: ConnectionTimers;
  lastActivityAt: number | null;
  closedByUser: boolean;
  leader: boolean;
  lockActive: boolean;
};

type ResolvedConnectionOptions = {
  headers?: Record<string, string>;
  protocols?: string | string[];
  reconnect: WsReconnectOptions;
  ping: WsPingOptions;
  label?: string;
  lock?: boolean;
};

const DEFAULT_RECONNECT: WsReconnectOptions = {
  enabled: true,
  retries: -1, // unlimited
  initialDelayMs: 500,
  maxDelayMs: 10_000,
  factor: 2,
};

const DEFAULT_PING: WsPingOptions = {
  intervalMs: 30_000,
  timeoutMs: 20_000,
  payload: 'ping',
};

const DEFAULT_MAX_CONNECTIONS = Number(process.env.WS_MAX_CONNECTIONS ?? 64);

@Injectable()
export class WsConnectionManager implements OnModuleDestroy {
  private readonly connections = new Map<string, ConnectionState>();
  private readonly maxConnections: number;

  constructor(
    private readonly logger: LoggerService,
    private readonly lockService: WsLockService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.maxConnections =
      this.configService.get<number>('ws.maxConnections', {
        infer: true,
      }) ?? DEFAULT_MAX_CONNECTIONS;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  subscribe(
    key: string,
    url: string,
    handlers: WsSubscriberHandlers,
    options?: WsConnectionOptions,
  ): WsSubscription {
    // Best practice: key should include provider + feed type + params
    const state = this.ensureConnection(key, url, options);
    const id = randomUUID();
    state.subscribers.set(id, handlers);

    if (state.ws?.readyState === WebSocket.OPEN) {
      handlers.onOpen?.(state.ws);
    }

    return {
      id,
      unsubscribe: () => this.unsubscribe(key, id),
    };
  }

  unsubscribe(key: string, subscriptionId: string): void {
    const state = this.connections.get(key);
    if (!state) return;
    state.subscribers.delete(subscriptionId);

    if (state.subscribers.size === 0) {
      this.teardownConnection(state, 'no-subscribers');
    }
  }

  close(key: string, reason = 'manual-close'): void {
    const state = this.connections.get(key);
    if (!state) return;
    state.closedByUser = true;
    this.teardownConnection(state, reason);
  }

  stats(): WsConnectionMetrics[] {
    return Array.from(this.connections.values()).map((state) => ({
      key: state.key,
      url: state.url,
      subscribers: state.subscribers.size,
      state: this.toStateLabel(state.ws),
      reconnectAttempts: state.reconnectAttempts,
      lastActivityAt: state.lastActivityAt,
      leader: state.leader,
      lockActive: state.lockActive,
    }));
  }

  /** Optional per-key stats helper */
  stat(key: string): WsConnectionMetrics | undefined {
    const state = this.connections.get(key);
    if (!state) return undefined;
    return {
      key: state.key,
      url: state.url,
      subscribers: state.subscribers.size,
      state: this.toStateLabel(state.ws),
      reconnectAttempts: state.reconnectAttempts,
      lastActivityAt: state.lastActivityAt,
      leader: state.leader,
      lockActive: state.lockActive,
    };
  }

  onModuleDestroy() {
    for (const state of this.connections.values()) {
      this.teardownConnection(state, 'module-destroy');
    }
    this.connections.clear();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  private ensureConnection(
    key: string,
    url: string,
    options?: WsConnectionOptions,
  ): ConnectionState {
    // key naming guidance: `${provider}:${feedType}:${params}`
    let state = this.connections.get(key);
    if (state) {
      state.options = this.mergeOptions(state.options, options);
      state.lockActive = this.shouldUseLock(state.options);
      return state;
    }

    state = {
      key,
      url,
      options: this.resolveOptions(options),
      ws: null,
      subscribers: new Map(),
      reconnectAttempts: 0,
      timers: {},
      lastActivityAt: null,
      closedByUser: false,
      leader: false,
      lockActive: false,
    };

    this.connections.set(key, state);
    this.initLeadership(state);
    return state;
  }

  private initLeadership(state: ConnectionState): void {
    state.lockActive = this.shouldUseLock(state.options);
    // If cluster lock is disabled or opted out, become leader immediately.
    if (!state.lockActive) {
      state.leader = true;
      this.open(state);
      return;
    }
    this.attemptAcquire(state, 0);
  }

  private shouldUseLock(options: ResolvedConnectionOptions): boolean {
    if (options.lock === false) return false;
    if (options.lock === true) return this.lockService.enabled;
    // inherit global
    return this.lockService.enabled;
  }

  private resolveOptions(
    options?: WsConnectionOptions,
  ): ResolvedConnectionOptions {
    return {
      headers: options?.headers,
      protocols: options?.protocols,
      label: options?.label,
      reconnect: { ...DEFAULT_RECONNECT, ...(options?.reconnect ?? {}) },
      ping: { ...DEFAULT_PING, ...(options?.ping ?? {}) },
      lock: options?.lock,
    };
  }

  private mergeOptions(
    current: ResolvedConnectionOptions,
    incoming?: WsConnectionOptions,
  ): ResolvedConnectionOptions {
    if (!incoming) return current;
    return {
      headers: incoming.headers ?? current.headers,
      protocols: incoming.protocols ?? current.protocols,
      label: incoming.label ?? current.label,
      reconnect: { ...current.reconnect, ...(incoming.reconnect ?? {}) },
      ping: { ...current.ping, ...(incoming.ping ?? {}) },
      lock: incoming.lock ?? current.lock,
    };
  }

  private open(state: ConnectionState): void {
    // Only leader may open when clustering is enabled
    if (state.lockActive && !state.leader) return;
    if (state.ws) return; // already open/connecting

    const liveConnections = Array.from(this.connections.values()).filter(
      (c) =>
        c.ws &&
        (c.ws.readyState === WebSocket.OPEN ||
          c.ws.readyState === WebSocket.CONNECTING),
    ).length;
    if (liveConnections >= this.maxConnections) {
      this.logger.warn(
        `WS connection budget reached (${liveConnections}/${this.maxConnections}); delaying open for ${state.key}`,
        state.key,
      );
      this.scheduleReconnect(state);
      return;
    }
    this.clearTimer(state, 'reconnect');
    const { url, options } = state;
    const ws = new WebSocket(url, options.protocols, {
      headers: options.headers,
    });
    state.ws = ws;
    state.closedByUser = false;

    const label = options.label || state.key;
    this.logger.debug(`WS connecting -> ${url} (${label})`, label);

    ws.on('open', () => {
      state.reconnectAttempts = 0;
      state.lastActivityAt = Date.now();
      this.logger.log(`WS connected -> ${url} (${label})`, label);
      this.startHeartbeat(state);
      state.subscribers.forEach((sub) => sub.onOpen?.(ws));
    });

    ws.on('message', (data) => {
      state.lastActivityAt = Date.now();
      state.subscribers.forEach((sub) => sub.onMessage(data, ws));
    });

    ws.on('pong', () => {
      state.lastActivityAt = Date.now();
    });

    ws.on('error', (err) => {
      this.logger.warn(
        `WS error (${label}): ${(err as Error)?.message ?? err}`,
        label,
      );
      state.subscribers.forEach((sub) => sub.onError?.(err));
    });

    ws.on('close', (code, reason) => {
      const reasonStr =
        typeof reason === 'string'
          ? reason
          : reason instanceof Buffer
            ? reason.toString()
            : '';
      this.logger.warn(
        `WS closed (${label}) code=${code} reason=${reasonStr || 'n/a'}`,
        label,
      );
      this.stopHeartbeat(state);
      state.subscribers.forEach((sub) => sub.onClose?.(code, reasonStr));
      state.ws = null;

      if (state.closedByUser || state.subscribers.size === 0) {
        this.teardownConnection(state, 'no-subscribers');
        return;
      }
      this.scheduleReconnect(state);
    });
  }

  private scheduleReconnect(state: ConnectionState): void {
    if (state.lockActive && !state.leader) return;
    const { reconnect } = state.options;
    if (!reconnect.enabled) {
      this.logger.warn(
        `WS reconnect disabled for ${state.key}; tearing down.`,
        state.key,
      );
      this.teardownConnection(state, 'reconnect-disabled');
      return;
    }

    const attempt = state.reconnectAttempts;
    const maxReached = reconnect.retries >= 0 && attempt >= reconnect.retries;
    if (maxReached) {
      this.logger.error(
        `WS reconnect limit reached for ${state.key}; giving up.`,
        state.key,
      );
      this.teardownConnection(state, 'reconnect-limit');
      return;
    }

    const delay = Math.min(
      reconnect.initialDelayMs * Math.pow(reconnect.factor, attempt),
      reconnect.maxDelayMs,
    );
    state.reconnectAttempts += 1;
    this.logger.warn(
      `WS reconnecting ${state.key} in ${delay}ms (attempt ${state.reconnectAttempts})`,
      state.key,
    );
    this.clearTimer(state, 'reconnect');
    state.timers.reconnect = setTimeout(() => this.open(state), delay);
  }

  private startHeartbeat(state: ConnectionState): void {
    if (state.lockActive && !state.leader) return;
    const { ping } = state.options;
    if (!ping.intervalMs || ping.intervalMs <= 0) return;
    this.clearTimer(state, 'ping');
    state.timers.ping = setInterval(() => {
      const ws = state.ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      const idleFor = state.lastActivityAt
        ? Date.now() - state.lastActivityAt
        : 0;
      if (ping.timeoutMs > 0 && idleFor > ping.timeoutMs) {
        this.logger.warn(
          `WS heartbeat stale (${state.key}); idle ${idleFor}ms > timeout ${ping.timeoutMs}ms. Terminating.`,
          state.key,
        );
        ws.terminate();
        return;
      }

      try {
        ws.ping(ping.payload);
      } catch (err) {
        this.logger.debug(
          `WS ping error (${state.key}): ${(err as Error)?.message ?? err}`,
          state.key,
        );
      }
    }, ping.intervalMs);
  }

  private stopHeartbeat(state: ConnectionState): void {
    this.clearTimer(state, 'ping');
  }

  private teardownConnection(state: ConnectionState, reason: string): void {
    this.clearTimer(state, 'ping');
    this.clearTimer(state, 'reconnect');
    this.clearTimer(state, 'lock');
    this.clearTimer(state, 'lockAttempt');
    const ws = state.ws;
    state.ws = null;
    state.closedByUser = true;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close(1000, reason);
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      ws.terminate();
    }
    if (state.lockActive && state.leader) {
      state.leader = false;
      this.lockService.release(state.key).catch(() => {});
    }
    this.connections.delete(state.key);
  }

  private clearTimer(state: ConnectionState, key: keyof ConnectionTimers) {
    const timer = state.timers[key];
    if (timer) {
      clearTimeout(timer as NodeJS.Timeout);
      clearInterval(timer as NodeJS.Timeout);
      state.timers[key] = undefined;
    }
  }

  private toStateLabel(ws: WebSocket | null): WsConnectionMetrics['state'] {
    if (!ws) return 'closed';
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
      default:
        return 'closed';
    }
  }

  // ---------------------------------------------------------------------------
  // Leader election per-connection (Redis lock)
  // ---------------------------------------------------------------------------
  private attemptAcquire(state: ConnectionState, delayMs: number) {
    if (!state.lockActive) return;
    this.clearTimer(state, 'lockAttempt');
    state.timers.lockAttempt = setTimeout(async () => {
      if (state.subscribers.size === 0) return;
      try {
        const ok = await this.lockService.tryAcquire(state.key);
        if (ok) {
          state.leader = true;
          this.logger.debug(
            `WS lock acquired for ${state.key}, acting as leader.`,
            state.key,
          );
          this.scheduleLockRenew(state);
          this.open(state);
        } else {
          state.leader = false;
          this.logger.debug(
            `WS lock not acquired for ${state.key}, will retry.`,
            state.key,
          );
          this.attemptAcquire(state, this.lockService.retryDelayMs);
        }
      } catch (err) {
        this.logger.warn(
          `WS lock acquire error for ${state.key}: ${(err as Error)?.message ?? err}`,
          state.key,
        );
        this.attemptAcquire(state, this.lockService.retryDelayMs);
      }
    }, delayMs);
  }

  private scheduleLockRenew(state: ConnectionState) {
    if (!state.lockActive) return;
    this.clearTimer(state, 'lock');
    state.timers.lock = setInterval(async () => {
      if (!state.leader || state.subscribers.size === 0) return;
      const ok = await this.lockService.renew(state.key);
      if (!ok) {
        this.logger.warn(
          `WS lock lost for ${state.key}; closing local connection.`,
          state.key,
        );
        state.leader = false;
        this.teardownConnection(state, 'lost-lock');
        this.attemptAcquire(state, this.lockService.retryDelayMs);
      }
    }, this.lockService.renewEveryMs);
  }
}
