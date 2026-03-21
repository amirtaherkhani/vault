import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayService } from 'src/common/api-gateway/api-gateway.service';
import {
  ApiFunction,
  RequestInput,
} from 'src/common/api-gateway/types/api-gateway.type';
import { AllConfigType } from 'src/config/config.type';
import { ConfigGet, ConfigGetOrThrow } from 'src/config/config.decorator';
import { getCmcBaseUrl } from '../cmc.helper';
import { CmcEnvironmentType } from '../types/cmc-enum.type';
import { CMC_DEFAULT_FIAT_CURRENCY, CMC_ENABLE } from '../types/cmc-const.type';

@Injectable()
export class CmcBaseService implements OnModuleInit {
  private readonly logger = new Logger(CmcBaseService.name);
  private apiClient: Record<string, ApiFunction> = {};

  @ConfigGet('cmc.envType', {
    inferEnvVar: true,
    defaultValue: CmcEnvironmentType.PRODUCTION,
  })
  private readonly envType!: CmcEnvironmentType;

  @ConfigGetOrThrow('cmc.apiKey', { inferEnvVar: true })
  private readonly apiKey!: string;

  @ConfigGet('cmc.enable', {
    inferEnvVar: true,
    defaultValue: CMC_ENABLE,
  })
  private readonly enableFlag!: boolean;

  @ConfigGet('cmc.defaultFiatCurrency', {
    inferEnvVar: true,
    defaultValue: CMC_DEFAULT_FIAT_CURRENCY,
  })
  private readonly defaultFiat!: string;

  constructor(
    private readonly apiGateway: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject('API_GATEWAY_CMC') apiClient?: Record<string, ApiFunction>,
  ) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  private get isEnabled(): boolean {
    return (
      this.configService.get('cmc.enable', this.enableFlag, { infer: true }) ??
      false
    );
  }

  onModuleInit(): void {
    if (!this.isEnabled) {
      this.logger.warn('CMC base transport is DISABLED. Skipping init.');
      return;
    }

    this.ensureClient();

    const baseUrl = getCmcBaseUrl(this.envType);
    if (baseUrl) {
      this.apiGateway.updateBaseUrl('CMC', baseUrl);
    }

    this.apiGateway.updateHeaders('CMC', {
      Accept: 'application/json',
      'X-CMC_PRO_API_KEY': this.apiKey,
    });

    // Refresh client reference after base URL / headers update
    this.ensureClient(true);
  }

  isReady(): boolean {
    return (
      this.isEnabled &&
      !!this.apiClient &&
      Object.keys(this.apiClient).length > 0
    );
  }

  getDefaultFiat(): string {
    return this.defaultFiat;
  }

  async call<T = unknown>(
    endpointName: string,
    input: RequestInput = {},
  ): Promise<T> {
    if (!this.isEnabled) {
      throw new Error('CMC provider is disabled by configuration');
    }

    this.ensureClient();
    const endpointFn = this.apiClient[endpointName];

    if (typeof endpointFn !== 'function') {
      throw new Error(`Missing CMC endpoint: ${endpointName}`);
    }

    return (await endpointFn(input)) as T;
  }

  private ensureClient(forceRefresh = false): void {
    if (
      forceRefresh ||
      !this.apiClient ||
      Object.keys(this.apiClient).length === 0
    ) {
      this.apiClient = this.apiGateway.getClient('CMC');
    }
  }
}
