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
import { RoleEnum } from '../../roles/roles.enum';
import { GroupPlainToInstance } from '../../utils/transformers/class.transformer';
import { STRIGA_ENDPOINTS } from './config/striga-endpoints.config';
import { StrigaConfig } from './config/striga-config.type';
import { StrigaBaseResponseDto } from './dto/striga-base.response.dto';
import {
  buildStrigaEndpointPath,
  createStrigaHmacAuthorization,
  getStrigaBaseUrl,
} from './striga.helper';
import {
  StrigaCreateAccountRequest,
  StrigaCreateUserRequest,
  StrigaEndpointName,
  StrigaKycRequest,
  StrigaPathParams,
  StrigaUpdateUserRequest,
  StrigaUserByEmailRequest,
} from './types/striga-base.type';
import {
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

    if (apiClient) this.apiClient = apiClient;
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
    if (!this.apiClient) {
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
    return this.isEnabled && !!this.apiClient;
  }

  async getUserById(userId: string): Promise<StrigaBaseResponseDto<any>> {
    const payload = await this.callSigned('getUserById', { param: { userId } });
    return this.toResponse(payload, RoleEnum.admin);
  }

  async ping(): Promise<StrigaBaseResponseDto<any>> {
    const payload = await this.callSigned('ping', { body: {} });
    return this.toResponse(payload, RoleEnum.admin);
  }

  async createUser(
    payload: StrigaCreateUserRequest,
  ): Promise<StrigaBaseResponseDto<any>> {
    const response = await this.callSigned('createUser', { body: payload });
    return this.toResponse(response, RoleEnum.admin);
  }

  async createAccount(
    payload: StrigaCreateAccountRequest,
  ): Promise<StrigaBaseResponseDto<any>> {
    const response = await this.callSigned('createWallet', { body: payload });
    return this.toResponse(response, RoleEnum.admin);
  }

  async initKyc(
    payload: StrigaKycRequest,
  ): Promise<StrigaBaseResponseDto<any>> {
    const response = await this.callSigned('startKyc', { body: payload });
    return this.toResponse(response, RoleEnum.admin);
  }

  async startKyc(
    payload: StrigaKycRequest,
  ): Promise<StrigaBaseResponseDto<any>> {
    const response = await this.callSigned('startKyc', { body: payload });
    return this.toResponse(response, RoleEnum.user);
  }

  async updateUser(
    payload: StrigaUpdateUserRequest,
  ): Promise<StrigaBaseResponseDto<any>> {
    const response = await this.callSigned('updateUser', { body: payload });
    return this.toResponse(response, RoleEnum.admin);
  }

  async getUserByEmail(email: string): Promise<StrigaBaseResponseDto<any>> {
    const payload: StrigaUserByEmailRequest = { email };
    const response = await this.callSigned('getUserByEmail', { body: payload });
    return this.toResponse(response, RoleEnum.admin);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      await this.ping();
      this.appLogger.log('Striga connection is OK.', StrigaService.name);
      return true;
    } catch (e: any) {
      this.appLogger.warn(
        `Striga connectivity check failed: ${e?.message || e}`,
        StrigaService.name,
      );
      return false;
    }
  }

  private async callSigned(
    endpointName: StrigaEndpointName,
    input: RequestInput = {},
  ): Promise<any> {
    this.checkIfEnabled();

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

    return this.unwrapPayload(payload);
  }

  private unwrapPayload<T>(payload: any): T {
    if (
      payload &&
      typeof payload === 'object' &&
      'data' in payload &&
      'statusCode' in payload
    ) {
      return payload.data as T;
    }

    return payload as T;
  }

  private toResponse<T>(
    data: T,
    role: RoleEnum,
  ): StrigaBaseResponseDto<Record<string, unknown> | T | null> {
    return GroupPlainToInstance(
      StrigaBaseResponseDto,
      {
        status: 200,
        success: true,
        message: 'success',
        error: null,
        data,
        hasNextPage: false,
      },
      [role],
    ) as StrigaBaseResponseDto<Record<string, unknown> | T | null>;
  }
}
