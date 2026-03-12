import { WsConnectionManager } from '../ws-connection.manager';
import {
  WsConnectionMetrics,
  WsConnectionOptions,
  WsSubscriberHandlers,
  WsSubscription,
} from '../types/ws-client.types';

/**
 * BaseWsFeedService
 * -----------------
 * Light OOP helper for services that consume upstream WebSocket feeds.
 * - Provides a consistent way to build stream keys (provider:feed:params).
 * - Wraps subscribe/unsubscribe with small conveniences.
 * - Exposes per-stream health lookup.
 */
export abstract class BaseWsFeedService {
  protected constructor(protected readonly ws: WsConnectionManager) {}

  /** Build a normalized stream key using colon-separated parts. */
  protected streamKey(
    provider: string,
    feed: string,
    ...parts: Array<string | number>
  ): string {
    const normalized = [provider, feed, ...parts]
      .map((p) => String(p ?? '').trim())
      .filter(Boolean);
    return normalized.join(':');
  }

  /** Subscribe to an upstream WS stream. */
  protected subscribeStream(
    key: string,
    url: string,
    handlers: WsSubscriberHandlers,
    options?: WsConnectionOptions,
  ): WsSubscription {
    return this.ws.subscribe(key, url, handlers, options);
  }

  /** Merge call-site options with common defaults (override in subclasses). */
  protected buildOptions(
    overrides?: WsConnectionOptions,
  ): WsConnectionOptions | undefined {
    return overrides;
  }

  /** Hooks for subclasses to override life-cycle behavior if needed. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onOpen?(key: string): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onClose?(key: string, code: number, reason: string): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onError?(key: string, error: any): void {}

  /** Convenience to unsubscribe and ignore errors. */
  protected safeUnsubscribe(sub?: WsSubscription): void {
    try {
      sub?.unsubscribe();
    } catch {
      /* ignore */
    }
  }

  /** Per-stream health snapshot. */
  protected streamHealth(key: string): WsConnectionMetrics | undefined {
    return this.ws.stat(key);
  }
}
