import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BinanceConfig } from './binance-config.type';
import {
  BINANCE_BASE_URL,
  BINANCE_DEFAULT_QUOTE_ASSET,
  BINANCE_ENABLE,
  BINANCE_REQUEST_TIMEOUT_MS,
  BINANCE_BASE_URLS,
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

  @IsString()
  @IsOptional()
  BINANCE_ALT_BASE_URLS?: string;
}

const defaults: BinanceConfig = {
  enable: BINANCE_ENABLE,
  baseUrl: BINANCE_BASE_URL,
  altBaseUrls: BINANCE_BASE_URLS.slice(1),
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
      altBaseUrls: env.BINANCE_ALT_BASE_URLS
        ? env.BINANCE_ALT_BASE_URLS.split(',')
            .map((u) => u.trim())
            .filter(Boolean)
        : defaults.altBaseUrls,
      requestTimeoutMs:
        env.BINANCE_REQUEST_TIMEOUT_MS ?? defaults.requestTimeoutMs,
      defaultQuoteAsset:
        env.BINANCE_DEFAULT_QUOTE_ASSET || defaults.defaultQuoteAsset,
    } satisfies Partial<BinanceConfig>;
  },
});
