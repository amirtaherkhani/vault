export type WsConfig = {
  enable: boolean;
  lockEnable: boolean;
  lockRedisUrl?: string;
  lockTtlMs: number;
  lockKeyPrefix: string;
  maxConnections: number;
};
