import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
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
  StrigaCreateWalletRequestDto,
  StrigaCreateUserRequestDto,
  StrigaExternalIdRequestDto,
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
import { StrigaUser } from './striga-users/domain/striga-user';
import { CreateStrigaUserDto } from './striga-users/dto/create-striga-user.dto';
import { UpdateStrigaUserDto } from './striga-users/dto/update-striga-user.dto';
import {
  StrigaUsersService,
  StrigaUserUpsertResult,
} from './striga-users/striga-users.service';
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
import { StrigaRequestWithContext } from './types/striga-request-context.type';

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
    private readonly strigaUsersService: StrigaUsersService,
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

  async getUserKycById(
    userId: string,
  ): Promise<StrigaUserKycStatusResponseDto> {
    const payload = await this.callSignedAdmin(
      STRIGA_ENDPOINT_NAME.getUserKycById,
      {
        param: { userId },
      },
    );
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

  async startKyc(
    payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.callSignedUser(STRIGA_ENDPOINT_NAME.startKyc, {
      body: payload,
    });
  }

  async startKycForCurrentUser(
    request: StrigaRequestWithContext,
    payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    const body = this.withCurrentStrigaUserId(
      request,
      payload as Record<string, unknown>,
    );
    return this.startKyc(body as StrigaKycRequestDto);
  }

  async getWalletsForCurrentUser(
    request: StrigaRequestWithContext,
    payload: StrigaGetAllWalletsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    const body = this.withCurrentStrigaUserId(
      request,
      payload as Record<string, unknown>,
    );
    return this.getAllWallets(body as StrigaGetAllWalletsRequestDto);
  }

  async getMyUserFromCloud(
    request: StrigaRequestWithContext,
  ): Promise<StrigaBaseResponseDto<any>> {
    const authUserId = request.user?.id;
    if (typeof authUserId === 'undefined' || authUserId === null) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    const strigaUser =
      await this.strigaUsersService.resolveStrigaUserForMe(authUserId);
    const externalId = String(strigaUser?.externalId ?? '').trim();

    if (!externalId) {
      throw new NotFoundException(
        'Striga user for current user was not found in local database.',
      );
    }

    return this.getUserById(externalId);
  }

  async getUserFromCloudByExternalId(
    payload: StrigaExternalIdRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    const externalId = String(payload.externalId ?? '').trim();
    if (!externalId) {
      throw new BadRequestException('externalId is required.');
    }

    return this.getUserById(externalId);
  }

  async updateContactForCurrentUser(
    request: StrigaRequestWithContext,
    payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    const updatePayload: StrigaUpdateUserRequestDto = {
      userId: this.getCurrentStrigaExternalId(request),
      mobile: payload.mobile,
      address: payload.address,
    };

    if (
      typeof updatePayload.mobile === 'undefined' &&
      typeof updatePayload.address === 'undefined'
    ) {
      throw new BadRequestException(
        'At least one of mobile or address must be provided.',
      );
    }

    const response = await this.callSignedUser(
      STRIGA_ENDPOINT_NAME.updateUser,
      {
        body: updatePayload,
      },
    );

    await this.syncLocalStrigaUserContact(updatePayload);

    return response;
  }

  async updateUser(
    payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    const userId = String(payload.userId ?? '').trim();
    if (!userId) {
      throw new BadRequestException('userId is required.');
    }

    const updatePayload: StrigaUpdateUserRequestDto = {
      ...payload,
      userId,
    };

    const response = await this.callSignedAdmin(
      STRIGA_ENDPOINT_NAME.updateUser,
      {
        body: updatePayload,
      },
    );

    await this.syncLocalStrigaUserContact(updatePayload);

    return response;
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

  async upsertLocalUserFromCloudPayload(
    cloudUser: Record<string, unknown>,
  ): Promise<StrigaUserUpsertResult> {
    const externalId = String(
      cloudUser.userId ?? cloudUser.externalId ?? '',
    ).trim();
    if (!externalId) {
      return { operation: 'skipped', user: null };
    }

    const email = String(cloudUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return { operation: 'skipped', user: null };
    }

    const firstName = String(cloudUser.firstName ?? '').trim() || 'Unknown';
    const lastName = String(cloudUser.lastName ?? '').trim() || 'Unknown';

    const mobile = this.normalizeMobileFromCloud(
      (cloudUser.mobile as Record<string, unknown>) ?? undefined,
    );
    const address = this.normalizeAddressFromCloud(
      (cloudUser.address as Record<string, unknown>) ?? undefined,
    );
    const kyc = this.normalizeKycFromCloud(
      (cloudUser.KYC as Record<string, unknown>) ??
        (cloudUser.kyc as Record<string, unknown>) ??
        undefined,
    );

    const payload: UpdateStrigaUserDto = {
      externalId,
      email,
      firstName,
      lastName,
      mobile,
      address,
      kyc,
    };

    const existingByExternalId =
      await this.strigaUsersService.findByExternalId(externalId);
    if (existingByExternalId) {
      if (!this.hasLocalUserChanges(existingByExternalId, payload)) {
        return { operation: 'unchanged', user: existingByExternalId };
      }

      const updated = await this.strigaUsersService.update(
        existingByExternalId.id,
        payload,
      );
      return { operation: 'updated', user: updated };
    }

    const existingByEmail = await this.strigaUsersService.findByEmail(email);
    if (existingByEmail) {
      if (!this.hasLocalUserChanges(existingByEmail, payload)) {
        return { operation: 'unchanged', user: existingByEmail };
      }

      const updated = await this.strigaUsersService.update(
        existingByEmail.id,
        payload,
      );
      return { operation: 'updated', user: updated };
    }

    const createPayload: CreateStrigaUserDto = {
      externalId,
      email,
      firstName,
      lastName,
      mobile,
      address,
      kyc,
    };

    const created = await this.strigaUsersService.create(createPayload);
    return { operation: 'created', user: created };
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

  private async syncLocalStrigaUserContact(
    payload: StrigaUpdateUserRequestDto,
  ): Promise<void> {
    const externalId = String(payload.userId ?? '').trim();
    if (!externalId) {
      return;
    }

    const mobile = payload.mobile
      ? {
          countryCode: payload.mobile.countryCode,
          number: payload.mobile.number,
        }
      : undefined;

    const address = payload.address
      ? {
          addressLine1: payload.address.addressLine1,
          addressLine2: payload.address.addressLine2,
          city: payload.address.city,
          state: payload.address.state,
          country: payload.address.country,
          postalCode: payload.address.postalCode,
        }
      : undefined;

    if (typeof mobile === 'undefined' && typeof address === 'undefined') {
      return;
    }

    try {
      const updated = await this.strigaUsersService.updateContactByExternalId(
        externalId,
        { mobile, address },
      );

      if (!updated) {
        this.appLogger.warn(
          `Local Striga user not found for externalId=${externalId}; mobile/address were not synced locally.`,
          StrigaService.name,
        );
        return;
      }

      this.appLogger.debug(
        `Local Striga user contact synced externalId=${externalId} mobileUpdated=${typeof mobile !== 'undefined'} addressUpdated=${typeof address !== 'undefined'}.`,
        StrigaService.name,
      );
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      this.appLogger.warn(
        `Failed to sync local Striga user contact externalId=${externalId}: ${message}`,
        StrigaService.name,
      );
    }
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

  private normalizeMobileFromCloud(
    mobile?: Record<string, unknown>,
  ): StrigaUser['mobile'] {
    return {
      countryCode:
        typeof mobile?.countryCode === 'string' ? mobile.countryCode : '',
      number: typeof mobile?.number === 'string' ? mobile.number : '',
    };
  }

  private normalizeAddressFromCloud(
    address?: Record<string, unknown>,
  ): StrigaUser['address'] {
    return {
      addressLine1:
        typeof address?.addressLine1 === 'string' ? address.addressLine1 : '',
      addressLine2:
        typeof address?.addressLine2 === 'string' ? address.addressLine2 : '',
      city: typeof address?.city === 'string' ? address.city : '',
      state: typeof address?.state === 'string' ? address.state : '',
      country: typeof address?.country === 'string' ? address.country : '',
      postalCode:
        typeof address?.postalCode === 'string' ? address.postalCode : '',
    };
  }

  private normalizeKycFromCloud(
    kyc?: Record<string, unknown>,
  ): StrigaUser['kyc'] | undefined {
    if (!kyc || typeof kyc !== 'object' || Array.isArray(kyc)) {
      return undefined;
    }

    const normalizeTier = (tier: unknown) => {
      if (!tier || typeof tier !== 'object' || Array.isArray(tier)) {
        return undefined;
      }
      const tierObj = tier as Record<string, unknown>;
      return {
        status: typeof tierObj.status === 'string' ? tierObj.status : undefined,
      };
    };

    return {
      status: typeof kyc.status === 'string' ? kyc.status : null,
      tier0: normalizeTier(kyc.tier0) ?? null,
      tier1: normalizeTier(kyc.tier1) ?? null,
      tier2: normalizeTier(kyc.tier2) ?? null,
      tier3: normalizeTier(kyc.tier3) ?? null,
    };
  }

  private hasLocalUserChanges(
    current: StrigaUser,
    payload: UpdateStrigaUserDto,
  ): boolean {
    const normalizedCurrentEmail = String(current.email ?? '')
      .trim()
      .toLowerCase();
    const normalizedPayloadEmail = String(payload.email ?? '')
      .trim()
      .toLowerCase();

    if (normalizedCurrentEmail !== normalizedPayloadEmail) {
      return true;
    }

    if (String(current.firstName ?? '') !== String(payload.firstName ?? '')) {
      return true;
    }

    if (String(current.lastName ?? '') !== String(payload.lastName ?? '')) {
      return true;
    }

    const currentMobile = JSON.stringify(current.mobile ?? {});
    const payloadMobile = JSON.stringify(payload.mobile ?? {});
    if (currentMobile !== payloadMobile) {
      return true;
    }

    const currentAddress = JSON.stringify(current.address ?? {});
    const payloadAddress = JSON.stringify(payload.address ?? {});
    if (currentAddress !== payloadAddress) {
      return true;
    }

    if (typeof payload.kyc !== 'undefined') {
      const currentKyc = JSON.stringify(current.kyc ?? null);
      const payloadKyc = JSON.stringify(payload.kyc ?? null);
      if (currentKyc !== payloadKyc) {
        return true;
      }
    }

    return false;
  }

  toSuccessResponse<T>(
    data: T,
    roles: RoleEnum | RoleEnum[] = [RoleEnum.admin, RoleEnum.user],
  ): StrigaBaseResponseDto<Record<string, unknown> | T | null> {
    return this.toResponse(data, roles);
  }

  private getCurrentStrigaExternalId(
    request: StrigaRequestWithContext,
  ): string {
    const externalId = String(
      request.striga?.strigaUser?.externalId ?? '',
    ).trim();

    if (!externalId) {
      throw new BadRequestException(
        'Current user does not have a linked Striga user.',
      );
    }

    return externalId;
  }

  private withCurrentStrigaUserId(
    request: StrigaRequestWithContext,
    payload: Record<string, unknown> = {},
  ): Record<string, unknown> {
    const userId = this.getCurrentStrigaExternalId(request);
    const nextPayload: Record<string, unknown> = { ...payload };

    nextPayload.userId = userId;
    if (Object.prototype.hasOwnProperty.call(nextPayload, 'externalId')) {
      nextPayload.externalId = userId;
    }

    return nextPayload;
  }
}
