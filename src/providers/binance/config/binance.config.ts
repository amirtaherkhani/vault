import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BinanceConfig } from './binance-config.type';
import {
  BINANCE_BASE_URL,
  BINANCE_DEFAULT_QUOTE_ASSET,
  BINANCE_ENABLE,
  BINANCE_REQUEST_TIMEOUT_MS,
} from '../types/binance-const.type';
import { createToggleableConfig } from '../../../config/config.helper';

class BinanceEnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  BINANCE_BASE_URL?: string;

  @IsBoolean()
  @IsOptional()
  BINANCE_ENABLE?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  BINANCE_REQUEST_TIMEOUT_MS?: number;

  @IsString()
  @IsOptional()
  BINANCE_DEFAULT_QUOTE_ASSET?: string;
}

const defaults: BinanceConfig = {
  enable: BINANCE_ENABLE,
  baseUrl: BINANCE_BASE_URL,
  requestTimeoutMs: BINANCE_REQUEST_TIMEOUT_MS,
  defaultQuoteAsset: BINANCE_DEFAULT_QUOTE_ASSET,
};

export default createToggleableConfig<
  BinanceConfig,
  BinanceEnvironmentVariablesValidator
>('binance', BinanceEnvironmentVariablesValidator, defaults, {
  enableKey: 'enable',
  enableEnvKey: 'BINANCE_ENABLE',
  mapEnabledConfig: (env) => {
    return {
      baseUrl: env.BINANCE_BASE_URL || defaults.baseUrl,
      requestTimeoutMs:
        env.BINANCE_REQUEST_TIMEOUT_MS ?? defaults.requestTimeoutMs,
      defaultQuoteAsset:
        env.BINANCE_DEFAULT_QUOTE_ASSET || defaults.defaultQuoteAsset,
    } satisfies Partial<BinanceConfig>;
  },
});
