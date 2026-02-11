import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { VeroConfig } from './vero-config.type';
import {
  BASE_VALUE_VERO_API_URL,
  BASE_VALUE_JWKS_URL,
  DEFAULT_JWKS_CACHE_MAX_AGE,
} from '../types/vero-auth-const.type';
import {
  booleanValidator,
  numberValidator,
} from '../../utils/helpers/env.helper';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  VERO_JWKS_URL: string;

  @IsInt()
  @Min(900000) // Minimum cache age of 5 minutes
  @Max(1800000) // Maximum cache age of 30 minutes
  @IsOptional()
  VERO_CACHE_MAX_AGE: number;

  @IsBoolean()
  @IsOptional()
  VERO_ENABLE_DYNAMIC_CACHE: boolean;

  @IsBoolean()
  @IsOptional()
  AUTH_VERO_USE_EXTERNAL_TOKEN: boolean;

  @IsString()
  @IsOptional()
  VERO_API_BASE_URL: string;
}

export default registerAs<VeroConfig>('vero', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const jwksUri = process.env.VERO_JWKS_URL
    ? process.env.VERO_JWKS_URL
    : BASE_VALUE_JWKS_URL;

  const jwksUriCacheMaxAge = numberValidator(
    process.env.VERO_CACHE_MAX_AGE,
    DEFAULT_JWKS_CACHE_MAX_AGE,
  );

  const enableDynamicCache = booleanValidator(
    process.env.VERO_ENABLE_DYNAMIC_CACHE,
    false,
  );

  const useExternalToken = booleanValidator(
    process.env.AUTH_VERO_USE_EXTERNAL_TOKEN,
    false,
  );

  const apiBaseUrl = process.env.VERO_API_BASE_URL
    ? process.env.VERO_API_BASE_URL
    : BASE_VALUE_VERO_API_URL;

  return {
    jwksUri,
    jwksUriCacheMaxAge,
    enableDynamicCache,
    apiBaseUrl,
    useExternalToken,
  };
});
