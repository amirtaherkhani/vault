import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';
import { Fireblocks, BasePath } from '@fireblocks/ts-sdk';
import { AllConfigType } from '../../../config/config.type';
import { ConfigGet, ConfigGetOrThrow } from '../../../config/config.decorator';
import { FireblocksCwAdminService } from './services/fireblocks-cw-admin.service';
import { FireblocksCwClientService } from './services/fireblocks-cw-client.service';
import { FireblocksCwWorkflowService } from './services/fireblocks-cw-workflow.service';
import { UsersService } from '../../../users/users.service';
import { FireblocksConfig } from './config/fireblocks-config.type';
import {
  FIREBLOCKS_CW_ENABLE,
  FIREBLOCKS_CW_ENV_TYPE,
  FIREBLOCKS_CW_API_KEY,
  FIREBLOCKS_CW_SECRET_KEY,
  FIREBLOCKS_CW_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  FIREBLOCKS_CW_CIRCUIT_BREAKER_HALF_OPEN_SAMPLE,
  FIREBLOCKS_CW_CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  FIREBLOCKS_CW_DEBUG_LOGGING,
  FIREBLOCKS_CW_MAX_RETRIES,
  FIREBLOCKS_CW_RATE_LIMIT_INTERVAL_MS,
  FIREBLOCKS_CW_RATE_LIMIT_TOKENS_PER_INTERVAL,
  FIREBLOCKS_CW_REQUEST_TIMEOUT_MS,
  FIREBLOCKS_CW_VAULT_NAME_PREFIX,
} from './types/fireblocks-const.type';
import { FireblocksEnvironmentType } from './types/fireblocks-enum.type';
import { BaseToggleableService } from '../../../common/base/base-toggleable.service';

@Injectable()
export class FireblocksCwService
  extends BaseToggleableService
  implements OnModuleInit, OnModuleDestroy
{
  static readonly displayName = 'Fireblocks Custodial Wallet';

  @ConfigGetOrThrow('fireblocks.apiKey', { inferEnvVar: true })
  private readonly apiKey?: string;

  @ConfigGetOrThrow('fireblocks.secretKey', { inferEnvVar: true })
  private readonly rawSecretKey?: string;

  @ConfigGet('fireblocks.envType', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_ENV_TYPE,
  })
  private readonly envType!: FireblocksEnvironmentType;

  @ConfigGet('fireblocks.requestTimeoutMs', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_REQUEST_TIMEOUT_MS,
  })
  private readonly requestTimeoutMs!: number;

  @ConfigGet('fireblocks.maxRetries', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_MAX_RETRIES,
  })
  private readonly maxRetries!: number;

  @ConfigGet('fireblocks.circuitBreaker.failureThreshold', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
  })
  private readonly circuitBreakerFailureThreshold!: number;

  @ConfigGet('fireblocks.circuitBreaker.resetTimeoutMs', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
  })
  private readonly circuitBreakerResetTimeoutMs!: number;

  @ConfigGet('fireblocks.circuitBreaker.halfOpenSample', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_CIRCUIT_BREAKER_HALF_OPEN_SAMPLE,
  })
  private readonly circuitBreakerHalfOpenSample!: number;

  @ConfigGet('fireblocks.rateLimit.tokensPerInterval', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_RATE_LIMIT_TOKENS_PER_INTERVAL,
  })
  private readonly rateLimitTokensPerInterval!: number;

  @ConfigGet('fireblocks.rateLimit.intervalMs', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_RATE_LIMIT_INTERVAL_MS,
  })
  private readonly rateLimitIntervalMs!: number;

  @ConfigGet('fireblocks.debugLogging', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_DEBUG_LOGGING,
  })
  private readonly debugLogging!: boolean;

  @ConfigGet('fireblocks.vaultNamePrefix', {
    inferEnvVar: true,
    defaultValue: FIREBLOCKS_CW_VAULT_NAME_PREFIX,
  })
  private readonly configuredVaultNamePrefix!: string;

  /**
   * Usage pattern (real Fireblocks flows):
   * 1) Verify user exists in DB (needs id + socialId).
   * 2) Use user data to resolve/find vault account (see FireblocksCwClientService.ensureUserVaultWalletForAsset).
   * 3) Confirm the vault belongs to the user (customerRefId/socialId-based name).
   * 4) If missing, create the vault with user id/socialId via ensure helper.
   * 5) If vault exists but wallet is missing, create AVAX (or target asset) wallet.
   * 6) If wallet exists, return/check it (ensure helper returns the existing wallet/address).
   */
  private readonly options: FireblocksConfig;
  private fireblocksSdk?: Fireblocks;
  public admin!: FireblocksCwAdminService;
  public client!: FireblocksCwClientService;
  public workflow!: FireblocksCwWorkflowService;

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly moduleRef: ModuleRef,
    private readonly usersService: UsersService,
  ) {
    super(
      FireblocksCwService.name,
      configService.get('fireblocks.enable', FIREBLOCKS_CW_ENABLE, {
        infer: true,
      }),
      {
        id: 'fireblocks-cw',
        displayName: FireblocksCwService.displayName,
        configKey: 'fireblocks.enable',
        envKey: 'FIREBLOCKS_CW_ENABLE',
        description: 'Fireblocks custodial wallet provider.',
        tags: ['provider', 'crypto'],
      },
    );
    this.options = this.buildOptions();
    this.logger.log(
      `Fireblocks client configured (env: ${this.options.envType})`,
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        'Fireblocks CW service is DISABLED. Skipping initialization.',
      );
      return;
    }

    this.logger.log('Initializing Fireblocks CW Sub services.');
    this.admin = this.moduleRef.get(FireblocksCwAdminService, {
      strict: false,
    });
    this.client = this.moduleRef.get(FireblocksCwClientService, {
      strict: false,
    });
    this.workflow = this.moduleRef.get(FireblocksCwWorkflowService, {
      strict: false,
    });

    await this.initializeSdk();
    await this.checkConnection();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.fireblocksSdk) {
      this.logger.log('Fireblocks SDK not initialized; skipping shutdown.');
      return;
    }

    await this.shutdown();
  }

  getOptions(): FireblocksConfig {
    return this.options;
  }

  public isReady(): boolean {
    this.checkIfEnabled();
    if (!this.fireblocksSdk) {
      this.logger.error(
        'Fireblocks SDK has not been initialized or is disabled.',
      );
      throw new ServiceUnavailableException(
        'Fireblocks SDK is not initialized.',
      );
    }
    return true;
  }

  getSdk(): Fireblocks {
    if (!this.fireblocksSdk) {
      this.logger.error(
        'Fireblocks SDK has not been initialized or is disabled.',
      );
      throw new Error('Fireblocks SDK has not been initialized');
    }
    return this.fireblocksSdk;
  }

  async buildVaultName(
    userId: number | string,
    fallbackSocialId?: string | null,
  ): Promise<string> {
    const user = await this.usersService.findById(userId);
    const suffix = user?.socialId ?? fallbackSocialId ?? userId;
    const configuredPrefix =
      (this.options.vaultNamePrefix ?? FIREBLOCKS_CW_VAULT_NAME_PREFIX) || '';
    const basePrefix =
      configuredPrefix.trim().length > 0
        ? configuredPrefix.trim()
        : FIREBLOCKS_CW_VAULT_NAME_PREFIX;
    const normalizedPrefix = basePrefix.endsWith(':')
      ? basePrefix
      : `${basePrefix}:`;
    return `${normalizedPrefix}${suffix}`;
  }

  /**
   * Build a vault name directly from an identifier (socialId/userId) without DB lookups.
   */
  buildVaultNameFromIdentifier(identifier: string): string {
    const configuredPrefix =
      (this.options.vaultNamePrefix ?? FIREBLOCKS_CW_VAULT_NAME_PREFIX) || '';
    const basePrefix =
      configuredPrefix.trim().length > 0
        ? configuredPrefix.trim()
        : FIREBLOCKS_CW_VAULT_NAME_PREFIX;
    const normalizedPrefix = basePrefix.endsWith(':')
      ? basePrefix
      : `${basePrefix}:`;
    return `${normalizedPrefix}${identifier}`;
  }

  private resolveBasePath(env: FireblocksEnvironmentType): string {
    switch (env) {
      case FireblocksEnvironmentType.PROD_US:
        return BasePath.US;
      case FireblocksEnvironmentType.PROD_EU:
        return BasePath.EU;
      case FireblocksEnvironmentType.PROD_EU2:
        return BasePath.EU2;
      case FireblocksEnvironmentType.SANDBOX:
      default:
        return BasePath.Sandbox;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  private async initializeSdk(): Promise<void> {
    this.logger.log('Starting Fireblocks SDK initialization (async mode)...');
    const baseUrl = this.resolveBasePath(this.options.envType);

    try {
      this.fireblocksSdk = new Fireblocks({
        apiKey: this.options.apiKey,
        secretKey: this.options.secretKey,
        basePath: baseUrl,
        additionalOptions: {
          baseOptions: {
            timeout: this.options.requestTimeoutMs,
          },
          userAgent: `${APP.name}`,
        },
      });

      this.logger.log(
        `Fireblocks SDK initialized successfully (base URL: ${baseUrl}).`,
      );
    } catch (error: unknown) {
      this.fireblocksSdk = undefined;
      this.logger.error(
        'Failed to initialize Fireblocks SDK.',
        error instanceof Error ? error.stack : `${error}`,
      );
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.fireblocksSdk) return;

    try {
      const data = await this.fireblocksSdk.web3Connections.get(); // Simple call to verify connectivity
      const status = data.statusCode;
      this.logger.log(`Fireblocks health check OK (status: ${status}).`);
    } catch (error: unknown) {
      const ok = this.isOkErrorResponse(error);
      if (ok.isOk) {
        this.logger.log(
          `Fireblocks health check OK (status: ${ok.status ?? 'unknown'}).`,
        );
        return;
      }
      const message = this.formatError(error);
      this.logger.warn(`Fireblocks connectivity check failed: ${message}`);
    }
  }

  private async shutdown(): Promise<void> {
    const sdk = this.fireblocksSdk;
    this.fireblocksSdk = undefined;

    if (!sdk) {
      return;
    }

    this.logger.log('Shutting down Fireblocks SDK resources...');

    const closableSdk = sdk as unknown as {
      close?: () => Promise<void> | void;
      destroy?: () => Promise<void> | void;
    };

    try {
      if (typeof closableSdk.close === 'function') {
        await closableSdk.close();
        this.logger.log(
          'Fireblocks SDK close() called to release pooled resources.',
        );
      } else if (typeof closableSdk.destroy === 'function') {
        await closableSdk.destroy();
        this.logger.log(
          'Fireblocks SDK destroy() called to release pooled resources.',
        );
      } else {
        this.logger.log(
          'Fireblocks SDK does not expose explicit shutdown hooks; reference cleared for GC.',
        );
      }
    } catch (error: unknown) {
      this.logger.error(
        'Error encountered while shutting down Fireblocks SDK resources.',
        error instanceof Error ? error.stack : `${error}`,
      );
    }
  }

  private buildOptions(): FireblocksConfig {
    const options: FireblocksConfig = {
      enable: this.getEnabled(),
      apiKey: this.apiKey ?? FIREBLOCKS_CW_API_KEY,
      secretKey: this.rawSecretKey ?? FIREBLOCKS_CW_SECRET_KEY,
      envType: this.envType ?? FIREBLOCKS_CW_ENV_TYPE,
      requestTimeoutMs:
        this.requestTimeoutMs ?? FIREBLOCKS_CW_REQUEST_TIMEOUT_MS,
      maxRetries: this.maxRetries ?? FIREBLOCKS_CW_MAX_RETRIES,
      circuitBreaker: {
        failureThreshold:
          this.circuitBreakerFailureThreshold ??
          FIREBLOCKS_CW_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        resetTimeoutMs:
          this.circuitBreakerResetTimeoutMs ??
          FIREBLOCKS_CW_CIRCUIT_BREAKER_RESET_TIMEOUT_MS,
        halfOpenSample:
          this.circuitBreakerHalfOpenSample ??
          FIREBLOCKS_CW_CIRCUIT_BREAKER_HALF_OPEN_SAMPLE,
      },
      rateLimit: {
        tokensPerInterval:
          this.rateLimitTokensPerInterval ??
          FIREBLOCKS_CW_RATE_LIMIT_TOKENS_PER_INTERVAL,
        intervalMs:
          this.rateLimitIntervalMs ?? FIREBLOCKS_CW_RATE_LIMIT_INTERVAL_MS,
      },
      debugLogging: this.debugLogging ?? FIREBLOCKS_CW_DEBUG_LOGGING,
      vaultNamePrefix:
        this.configuredVaultNamePrefix ?? FIREBLOCKS_CW_VAULT_NAME_PREFIX,
    };

    if (
      options.enable &&
      (!options.apiKey?.trim()?.length || !options.secretKey?.trim()?.length)
    ) {
      throw new Error(
        'Fireblocks CW is enabled but apiKey or secretKey is missing. Please set FIREBLOCKS_CW_API_KEY and FIREBLOCKS_CW_SECRET_KEY.',
      );
    }

    if (!options.enable) {
      options.apiKey = '';
      options.secretKey = '';
    } else {
      options.secretKey = this.normalizeSecretKey(options.secretKey);
    }

    return options;
  }

  /**
   * Normalize PEM strings that are provided via environment variables.
   * Many setups store the key on a single line using escaped newlines,
   * which must be converted back before passing to JWT.
   */
  private normalizeSecretKey(secretKey: string): string {
    if (!secretKey) return secretKey;
    return secretKey.includes('\\n')
      ? secretKey.replace(/\\n/g, '\n')
      : secretKey;
  }

  /**
   * Format SDK or HTTP errors so we log a helpful message instead of [object Object].
   */
  private formatError(error: unknown): string {
    if (!error) return 'Unknown error';

    if (error instanceof Error) {
      const response = (error as any).response;
      const status =
        response?.status ?? response?.statusCode ?? (error as any).status;
      const code = (error as any).code;
      const data = response?.data ?? (error as any).data;
      const parts: string[] = [error.message];
      if (status) parts.push(`status=${status}`);
      if (code) parts.push(`code=${code}`);
      if (data) {
        try {
          parts.push(`data=${JSON.stringify(data)}`);
        } catch {
          parts.push(`data=${String(data)}`);
        }
      }
      return parts.filter(Boolean).join(' | ');
    }

    if (typeof error === 'object') {
      const anyError = error as Record<string, any>;
      const response = anyError.response;
      const status =
        response?.status ??
        response?.statusCode ??
        anyError.status ??
        anyError.statusCode;
      const code = anyError.code ?? anyError.errorCode;
      const msg = anyError.message ?? anyError.error ?? anyError.title;
      const data = response?.data ?? anyError.data ?? anyError.body;
      const parts: string[] = [];
      if (msg) parts.push(String(msg));
      if (status) parts.push(`status=${status}`);
      if (code) parts.push(`code=${code}`);
      if (data) {
        try {
          parts.push(`data=${JSON.stringify(data)}`);
        } catch {
          parts.push(`data=${String(data)}`);
        }
      }
      if (parts.length) return parts.join(' | ');
      try {
        return JSON.stringify(error);
      } catch {
        return `${error}`;
      }
    }

    return String(error);
  }

  /**
   * Some Fireblocks SDK errors wrap a response with { message: 'ok', code: 0 }.
   * Only treat that as success if the HTTP status is < 400 (or missing).
   */
  private isOkErrorResponse(error: unknown): {
    isOk: boolean;
    status?: number;
  } {
    if (!error || typeof error !== 'object') return { isOk: false };
    const response = (error as any).response;
    const data = response?.data ?? (error as any).data;
    const status =
      response?.status ??
      response?.statusCode ??
      (response?.data?.status as any);

    if (
      (status === undefined || (typeof status === 'number' && status < 400)) &&
      data?.message === 'ok' &&
      (data?.code === 0 || data?.status === 'ok')
    ) {
      return { isOk: true, status };
    }

    return { isOk: false, status };
  }
}
