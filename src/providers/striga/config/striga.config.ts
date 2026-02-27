import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { createToggleableConfig } from '../../../config/config.helper';
import { StrigaConfig } from './striga-config.type';
import {
  STRIGA_CARD_ASSET_NAMES,
  STRIGA_CARD_DEFAULT_PASSWORD,
  STRIGA_ENABLE,
  STRIGA_MAX_RETRIES,
  STRIGA_REQUEST_TIMEOUT_MS,
  STRIGA_SANDBOX_BASE_URL,
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
} from '../types/striga-const.type';

function parseCsvToUppercaseList(
  value: string | undefined,
  fallback: string[],
): string[] {
  if (!value || value.trim().length === 0) {
    return [...fallback];
  }

  const normalized = value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(
      (item) =>
        item.length > 0 &&
        (STRIGA_SUPPORTED_CARD_ASSET_NAMES as readonly string[]).includes(item),
    );

  const deduplicated = Array.from(new Set(normalized));
  return deduplicated.length > 0 ? deduplicated : [...fallback];
}

class StrigaEnvironmentVariablesValidator {
  @IsString()
  STRIGA_APPLICATION_ID: string;

  @IsString()
  STRIGA_API_KEY: string;

  @IsString()
  STRIGA_API_SECRET: string;

  @IsString()
  STRIGA_UI_SECRET: string;

  @IsString()
  @IsOptional()
  STRIGA_BASE_URL?: string;

  @IsBoolean()
  @IsOptional()
  STRIGA_ENABLE?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  STRIGA_REQUEST_TIMEOUT_MS?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  STRIGA_MAX_RETRIES?: number;

  @IsString()
  @IsOptional()
  STRIGA_CARD_ASSET_NAMES?: string;

  @IsString()
  @IsOptional()
  STRIGA_CARD_DEFAULT_PASSWORD?: string;
}

const defaults: StrigaConfig = {
  enable: STRIGA_ENABLE,
  applicationId: '',
  apiKey: '',
  apiSecret: '',
  uiSecret: '',
  baseUrl: STRIGA_SANDBOX_BASE_URL,
  requestTimeoutMs: STRIGA_REQUEST_TIMEOUT_MS,
  maxRetries: STRIGA_MAX_RETRIES,
  cardCreateAssetNames: STRIGA_CARD_ASSET_NAMES,
  cardDefaultPassword: STRIGA_CARD_DEFAULT_PASSWORD,
};

export default createToggleableConfig<
  StrigaConfig,
  StrigaEnvironmentVariablesValidator
>('striga', StrigaEnvironmentVariablesValidator, defaults, {
  enableKey: 'enable',
  enableEnvKey: 'STRIGA_ENABLE',
  mapEnabledConfig: (env) => ({
    applicationId: env.STRIGA_APPLICATION_ID,
    apiKey: env.STRIGA_API_KEY,
    apiSecret: env.STRIGA_API_SECRET,
    uiSecret: env.STRIGA_UI_SECRET,
    baseUrl: env.STRIGA_BASE_URL ?? defaults.baseUrl,
    requestTimeoutMs:
      env.STRIGA_REQUEST_TIMEOUT_MS ?? defaults.requestTimeoutMs,
    maxRetries: env.STRIGA_MAX_RETRIES ?? defaults.maxRetries,
    cardCreateAssetNames: parseCsvToUppercaseList(
      env.STRIGA_CARD_ASSET_NAMES,
      defaults.cardCreateAssetNames,
    ),
    cardDefaultPassword:
      env.STRIGA_CARD_DEFAULT_PASSWORD ?? defaults.cardDefaultPassword,
  }),
});
