import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { createToggleableConfig } from '../../../config/config.helper';
import { StrigaConfig } from './striga-config.type';
import {
  STRIGA_ENABLE,
  STRIGA_MAX_RETRIES,
  STRIGA_REQUEST_TIMEOUT_MS,
  STRIGA_SANDBOX_BASE_URL,
} from '../types/striga-const.type';

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
  }),
});
