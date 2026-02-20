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
import { StrigaUserKycStatusResponseDto } from './dto/striga-kyc.response.dto';
import {
  StrigaCreateAccountRequestDto,
  StrigaCreateWalletRequestDto,
  StrigaCreateUserRequestDto,
  StrigaGetAllWalletsRequestDto,
  StrigaGetWalletAccountRequestDto,
  StrigaGetWalletAccountStatementRequestDto,
  StrigaGetWalletRequestDto,
  StrigaKycRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaUpdateVerifiedCredentialsRequestDto,
  StrigaUpdateUserRequestDto,
  StrigaUserByEmailRequestDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from './dto/striga-request.dto';
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
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getUserById, {
      param: { userId },
    });
  }

  async getUserKycById(userId: string): Promise<StrigaUserKycStatusResponseDto> {
    const payload = await this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getUserKycById, {
      param: { userId },
    });
    return GroupPlainToInstance(StrigaUserKycStatusResponseDto, payload, [
      RoleEnum.admin,
    ]) as StrigaUserKycStatusResponseDto;
  }

  async ping(): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.ping, {
      body: {},
    });
  }

  async createUser(
    payload: StrigaCreateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.createUser, {
      body: payload,
    });
  }

  async createAccount(
    payload: StrigaCreateAccountRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.createAccount, {
      body: payload,
    });
  }

  async getWalletAccount(
    payload: StrigaGetWalletAccountRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getWalletAccount, {
      body: payload,
    });
  }

  async getWalletAccountStatement(
    payload: StrigaGetWalletAccountStatementRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(
      STRIGA_ENDPOINT_NAME.getWalletAccountStatement,
      {
        body: payload,
      },
    );
  }

  async getAllWallets(
    payload: StrigaGetAllWalletsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getAllWallets, {
      body: payload,
    });
  }

  async getWallet(
    payload: StrigaGetWalletRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getWallet, {
      body: payload,
    });
  }

  async createWallet(
    payload: StrigaCreateWalletRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.createWallet, {
      body: payload,
    });
  }

  async initKyc(
    payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.startKyc, {
      body: payload,
    });
  }

  async startKyc(
    payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedUser(STRIGA_ENDPOINT_NAME.startKyc, {
      body: payload,
    });
  }

  async updateUser(
    payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.updateUser, {
      body: payload,
    });
  }

  async updateVerifiedCredentials(
    payload: StrigaUpdateVerifiedCredentialsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(
      STRIGA_ENDPOINT_NAME.updateVerifiedCredentials,
      {
        body: payload,
      },
    );
  }

  async getUserByEmail(
    payload: StrigaUserByEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.getUserByEmail, {
      body: payload,
    });
  }

  async verifyEmail(
    payload: StrigaVerifyEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.verifyEmail, {
      body: payload,
    });
  }

  async resendEmail(
    payload: StrigaResendEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.resendEmail, {
      body: payload,
    });
  }

  async verifyMobile(
    payload: StrigaVerifyMobileRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.verifyMobile, {
      body: payload,
    });
  }

  async resendSms(
    payload: StrigaResendSmsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedAdmin(STRIGA_ENDPOINT_NAME.resendSms, {
      body: payload,
    });
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

  private async callSignedWithRoles(
    endpointName: StrigaEndpointName,
    roles: RoleEnum | RoleEnum[],
    input: RequestInput = {},
  ): Promise<StrigaBaseResponseDto<any>> {
    const payload = await this.callSigned(endpointName, input);
    return this.toResponse(payload, roles);
  }

  private async callSignedAdmin(
    endpointName: StrigaEndpointName,
    input: RequestInput = {},
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedWithRoles(endpointName, RoleEnum.admin, input);
  }

  private async callSignedUser(
    endpointName: StrigaEndpointName,
    input: RequestInput = {},
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedWithRoles(endpointName, RoleEnum.user, input);
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
    roles: RoleEnum | RoleEnum[],
  ): StrigaBaseResponseDto<Record<string, unknown> | T | null> {
    const groups = Array.isArray(roles) ? roles : [roles];
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
      groups,
    ) as StrigaBaseResponseDto<Record<string, unknown> | T | null>;
  }
}
