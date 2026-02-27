import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayService } from 'src/common/api-gateway/api-gateway.service';
import {
  ApiFunction,
  RequestInput,
} from 'src/common/api-gateway/types/api-gateway.type';
import { BaseToggleableService } from 'src/common/base/base-toggleable.service';
import { LoggerService } from 'src/common/logger/logger.service';
import { ConfigGet, ConfigGetOrThrow } from '../../config/config.decorator';
import { AllConfigType } from '../../config/config.type';
import { STRIGA_ENDPOINTS } from './config/striga-endpoints.config';
import { StrigaConfig } from './config/striga-config.type';
import { StrigaPingRequestDto } from './dto/striga-base.request.dto';
import {
  StrigaBaseResponseDto,
  StrigaPingResponseDto,
} from './dto/striga-base.response.dto';
import { StrigaResponseMapper } from './infrastructure/persistence/relational/mappers/striga.mapper';
import {
  buildStrigaEndpointPath,
  createStrigaHmacAuthorization,
  getStrigaBaseUrl,
} from './striga.helper';
import {
  STRIGA_ENDPOINT_NAME,
  StrigaEndpointName,
  StrigaPathParams,
} from './types/striga-base.type';
import {
  STRIGA_CARD_CREATE_ASSET_NAMES,
  STRIGA_ENABLE,
  STRIGA_SANDBOX_BASE_URL,
} from './types/striga-const.type';

@Injectable()
export class StrigaService
  extends BaseToggleableService
  implements OnModuleInit
{
  static readonly displayName = 'Striga';

  private apiClient: Record<string, ApiFunction> = {};

  @ConfigGet('striga.baseUrl', {
    inferEnvVar: true,
    defaultValue: STRIGA_SANDBOX_BASE_URL,
  })
  private readonly configuredBaseUrl!: StrigaConfig['baseUrl'];

  @ConfigGetOrThrow('striga.apiKey', { inferEnvVar: true })
  private readonly apiKey!: StrigaConfig['apiKey'];

  @ConfigGetOrThrow('striga.apiSecret', { inferEnvVar: true })
  private readonly apiSecret!: StrigaConfig['apiSecret'];

  @ConfigGet('striga.cardCreateAssetNames', {
    inferEnvVar: true,
    defaultValue: STRIGA_CARD_CREATE_ASSET_NAMES,
  })
  private readonly cardCreateAssetNames!: StrigaConfig['cardCreateAssetNames'];

  constructor(
    private readonly apiSdkService: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly appLogger: LoggerService,
    @Inject('API_GATEWAY_STRIGA') apiClient?: Record<string, ApiFunction>,
  ) {
    super(
      StrigaService.name,
      configService.get('striga.enable', STRIGA_ENABLE, { infer: true }),
      {
        id: 'striga',
        displayName: StrigaService.displayName,
        configKey: 'striga.enable',
        envKey: 'STRIGA_ENABLE',
        description: 'Striga API provider.',
        tags: ['provider', 'banking'],
      },
    );

    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.appLogger.warn(
        'Striga service is DISABLED. Skipping initialization.',
        StrigaService.name,
      );
      return;
    }

    this.appLogger.log(
      'Striga service is ENABLED. Proceeding with initialization.',
      StrigaService.name,
    );

    if (!this.apiClient || Object.keys(this.apiClient).length === 0) {
      this.apiClient = this.apiSdkService.getClient('STRIGA');
    }
    if (!this.apiClient || Object.keys(this.apiClient).length === 0) {
      this.appLogger.error(
        'Striga API client is not initialized.',
        undefined,
        StrigaService.name,
      );
      return;
    }

    const baseUrl = getStrigaBaseUrl(this.configuredBaseUrl);
    this.apiSdkService.updateBaseUrl('STRIGA', baseUrl);
    this.apiSdkService.updateHeaders('STRIGA', {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
    });

    this.apiClient = this.apiSdkService.getClient('STRIGA');
    await this.checkConnection();
  }

  public isReady(): boolean {
    return (
      this.isEnabled &&
      !!this.apiClient &&
      Object.keys(this.apiClient).length > 0
    );
  }

  getCardCreateAssetNames(): string[] {
    return Array.isArray(this.cardCreateAssetNames)
      ? [...this.cardCreateAssetNames]
      : [];
  }

  async pingFromProvider(
    payload: StrigaPingRequestDto = {},
  ): Promise<StrigaBaseResponseDto<StrigaPingResponseDto>> {
    return this.signedRequest<StrigaPingResponseDto>(
      STRIGA_ENDPOINT_NAME.ping,
      {
        body: payload,
      },
    );
  }

  async signedRequest<T = unknown>(
    endpointName: StrigaEndpointName,
    input: RequestInput = {},
  ): Promise<StrigaBaseResponseDto<T>> {
    this.checkIfEnabled();
    this.ensureClient();

    const endpoint = STRIGA_ENDPOINTS[endpointName];
    const endpointPath = buildStrigaEndpointPath(
      endpoint.path,
      input.param as StrigaPathParams | undefined,
    );

    const headers = {
      ...(input.headers ?? {}),
      authorization: createStrigaHmacAuthorization({
        apiSecret: this.apiSecret,
        method: endpoint.method,
        endpoint: endpointPath,
        body: input.body,
      }),
      'api-key': this.apiKey,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    const endpointFn = this.apiClient[endpointName];
    if (typeof endpointFn !== 'function') {
      throw new Error(`Missing Striga endpoint in API client: ${endpointName}`);
    }

    const payload = await endpointFn({
      ...input,
      headers,
    });

    return StrigaResponseMapper.toDomain<T>(payload);
  }

  private ensureClient(): void {
    if (!this.apiClient || Object.keys(this.apiClient).length === 0) {
      this.apiClient = this.apiSdkService.getClient('STRIGA');
    }
  }

  private async checkConnection(): Promise<boolean> {
    try {
      await this.signedRequest(STRIGA_ENDPOINT_NAME.ping, { body: {} });
      this.appLogger.log('Striga connection is OK.', StrigaService.name);
      return true;
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      this.appLogger.warn(
        `Striga connectivity check failed: ${message}`,
        StrigaService.name,
      );
      return false;
    }
  }
}
