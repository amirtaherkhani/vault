import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { createToggleableConfig } from '../../../config/config.helper';
import { WsConfig } from './ws-config.type';
import {
  WS_DEFAULT_ENABLE,
  WS_DEFAULT_LOCK_ENABLE,
  WS_DEFAULT_LOCK_KEY_PREFIX,
  WS_DEFAULT_LOCK_TTL_MS,
  WS_DEFAULT_MAX_CONNECTIONS,
} from '../types/ws-const.type';

class WsEnvValidator {
  @IsBoolean()
  @IsOptional()
  WS_ENABLE?: boolean;

  @IsBoolean()
  @IsOptional()
  WS_LOCK_ENABLE?: boolean;

  @IsString()
  @IsOptional()
  WS_LOCK_REDIS_URL?: string;

  @IsInt()
  @Min(1000)
  @IsOptional()
  WS_LOCK_TTL_MS?: number;

  @IsString()
  @IsOptional()
  WS_LOCK_KEY_PREFIX?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  WS_MAX_CONNECTIONS?: number;
}

const defaults: WsConfig = {
  enable: WS_DEFAULT_ENABLE,
  lockEnable: WS_DEFAULT_LOCK_ENABLE,
  lockRedisUrl: undefined,
  lockTtlMs: WS_DEFAULT_LOCK_TTL_MS,
  lockKeyPrefix: WS_DEFAULT_LOCK_KEY_PREFIX,
  maxConnections: WS_DEFAULT_MAX_CONNECTIONS,
};

export default createToggleableConfig<WsConfig, WsEnvValidator>(
  'ws',
  WsEnvValidator,
  defaults,
  {
    enableKey: 'enable',
    enableEnvKey: 'WS_ENABLE',
    mapEnabledConfig: (env) => ({
      lockEnable: env.WS_LOCK_ENABLE ?? defaults.lockEnable,
      lockRedisUrl: env.WS_LOCK_REDIS_URL ?? defaults.lockRedisUrl,
      lockTtlMs: env.WS_LOCK_TTL_MS ?? defaults.lockTtlMs,
      lockKeyPrefix: env.WS_LOCK_KEY_PREFIX ?? defaults.lockKeyPrefix,
      maxConnections: env.WS_MAX_CONNECTIONS ?? defaults.maxConnections,
    }),
    mapDisabledConfig: () => ({
      lockEnable: false,
      lockRedisUrl: undefined,
    }),
  },
);
