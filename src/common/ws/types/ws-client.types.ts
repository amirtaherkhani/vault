import WebSocket from 'ws';

export type WsSubscriberHandlers = {
  /** Required: called on every incoming message. */
  onMessage: (data: WebSocket.RawData, ws: WebSocket) => void;
  /** Optional hooks for lifecycle. */
  onOpen?: (ws: WebSocket) => void;
  onClose?: (code: number, reason: string) => void;
  onError?: (error: any) => void;
};

export type WsReconnectOptions = {
  enabled: boolean;
  retries: number; // -1 for unlimited
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
};

export type WsPingOptions = {
  intervalMs: number;
  timeoutMs: number;
  payload?: string | Buffer;
};

export type WsConnectionOptions = {
  headers?: Record<string, string>;
  protocols?: string | string[];
  /** Auto reconnect strategy */
  reconnect?: Partial<WsReconnectOptions>;
  /** Heartbeat ping/pong */
  ping?: Partial<WsPingOptions>;
  /** Optional label for logs */
  label?: string;
  /** Override cluster lock per subscription (default: inherit global) */
  lock?: boolean;
};

export type WsSubscription = {
  id: string;
  unsubscribe: () => void;
};

export type WsConnectionMetrics = {
  key: string;
  url: string;
  subscribers: number;
  state: 'connecting' | 'open' | 'closing' | 'closed';
  reconnectAttempts: number;
  lastActivityAt: number | null;
  leader?: boolean;
  lockActive?: boolean;
};
