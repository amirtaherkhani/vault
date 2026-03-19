// WebSocket request/response contracts (JSON frames) for Binance user data streams and commands.

export type BinanceWsRequest<TParams = Record<string, unknown>> = {
  id: string | number | null;
  method: string;
  params?: TParams;
};

export type BinanceWsError = {
  code: number;
  msg: string;
  data?: {
    serverTime?: number;
    retryAfter?: number;
    [key: string]: unknown;
  };
};

export type BinanceWsRateLimit = {
  rateLimitType: string;
  interval: string;
  intervalNum: number;
  limit: number;
  count: number;
};

export type BinanceWsResponse<TResult = unknown> = {
  id: string | number | null;
  status: number;
  result?: TResult;
  error?: BinanceWsError;
  rateLimits?: BinanceWsRateLimit[];
};

export type BinanceUserDataSubscriptionResult = {
  subscriptionId: number;
};

export type BinanceUserDataSubscriptionRequest = BinanceWsRequest<
  Record<string, never>
>;

export type BinanceUserDataSignatureSubscriptionRequest =
  BinanceWsRequest<BinanceUserDataSignatureParams>;

export type BinanceUserDataUnsubscribeRequest = BinanceWsRequest<{
  subscriptionId?: number;
}>;

export type BinanceSessionSubscriptionsRequest = BinanceWsRequest<
  Record<string, never>
>;

export type BinanceSessionStatusRequest = BinanceWsRequest<
  Record<string, never>
>;

export type BinanceUserDataSignatureParams = {
  apiKey: string;
  timestamp: number;
  signature: string;
  recvWindow?: number;
  returnRateLimits?: boolean;
};

export type BinanceUserDataSignatureRequest =
  BinanceWsRequest<BinanceUserDataSignatureParams>;

// Common user-data stream events (partial, add as needed)
export type BinanceUserAccountBalance = {
  a: string; // asset
  f: string; // free
  l: string; // locked
};

export type BinanceUserOutboundAccountPositionEvent = {
  e: 'outboundAccountPosition';
  E: number;
  u: number;
  B: BinanceUserAccountBalance[];
};

export type BinanceUserBalanceUpdateEvent = {
  e: 'balanceUpdate';
  E: number;
  a: string;
  d: string;
  T: number;
};

export type BinanceUserExecutionReportEvent = {
  e: 'executionReport';
  E: number;
  s: string;
  c: string;
  S: string;
  o: string;
  f: string;
  q: string;
  p: string;
  P: string;
  F: string;
  g: number;
  C: string;
  x: string;
  X: string;
  r: string;
  i: number;
  l: string;
  z: string;
  L: string;
  n: string;
  N: string | null;
  T: number;
  t: number;
  v?: number;
  I?: number;
  w: boolean;
  m: boolean;
  M: boolean;
  O: number;
  Z: string;
  Y: string;
  Q: string;
  W?: number;
  V?: string;
};

export type BinanceUserListStatusEvent = {
  e: 'listStatus';
  E: number;
  s: string;
  g: number;
  c: string;
  l: string;
  L: string;
  r: string;
  C: string;
  T: number;
  O: Array<{ s: string; i: number; c: string }>;
};

export type BinanceUserEvent =
  | BinanceUserOutboundAccountPositionEvent
  | BinanceUserBalanceUpdateEvent
  | BinanceUserExecutionReportEvent
  | BinanceUserListStatusEvent
  | { e: 'eventStreamTerminated'; E: number }
  | { e: 'externalLockUpdate'; E: number; a: string; d: string; T: number };

export type BinanceUserEventFrame = {
  subscriptionId?: number;
  event: BinanceUserEvent;
};
