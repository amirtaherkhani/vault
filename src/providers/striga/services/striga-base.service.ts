import { RequestInput } from 'src/common/api-gateway/types/api-gateway.type';
import {
  StrigaCreateUserRequestDto,
  StrigaCreateWalletRequestDto,
  StrigaGetAllWalletsRequestDto,
  StrigaGetWalletAccountRequestDto,
  StrigaGetWalletAccountStatementRequestDto,
  StrigaGetWalletRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaUpdateUserRequestDto,
  StrigaUpdateVerifiedCredentialsRequestDto,
  StrigaUserByEmailRequestDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from '../dto/striga-base.request.dto';
import { StrigaBaseResponseDto } from '../dto/striga-base.response.dto';
import { StrigaStartKycProviderRequestDto } from '../dto/striga-start-kyc.dto';
import { StrigaService } from '../striga.service';
import {
  STRIGA_ENDPOINT_NAME,
  StrigaEndpointName,
} from '../types/striga-base.type';

export abstract class StrigaBaseService {
  protected constructor(protected readonly strigaService: StrigaService) {}

  getEnabled(): boolean {
    return this.strigaService.getEnabled();
  }

  isReady(): boolean {
    return this.strigaService.isReady();
  }

  protected signedRequest<T = unknown>(
    endpointName: StrigaEndpointName,
    input: RequestInput = {},
  ): Promise<StrigaBaseResponseDto<T>> {
    return this.strigaService.signedRequest<T>(endpointName, input);
  }

  async findStatusFromProvider(): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.ping, {
      body: {},
    });
  }

  async findUserByIdFromProvider(
    userId: string,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getUserById, {
      param: { userId },
    });
  }

  async findUserKycByIdFromProvider(
    userId: string,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getUserKycById, {
      param: { userId },
    });
  }

  async createUserInProvider(
    payload: StrigaCreateUserRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.createUser, {
      body: payload,
    });
  }

  async updateUserInProvider(
    payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.updateUser, {
      body: payload,
    });
  }

  async updateVerifiedCredentialsInProvider(
    payload: StrigaUpdateVerifiedCredentialsRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.updateVerifiedCredentials, {
      body: payload,
    });
  }

  async findUserByEmailFromProvider(
    payload: StrigaUserByEmailRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getUserByEmail, {
      body: payload,
    });
  }

  async verifyEmailInProvider(
    payload: StrigaVerifyEmailRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.verifyEmail, {
      body: payload,
    });
  }

  async resendEmailInProvider(
    payload: StrigaResendEmailRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.resendEmail, {
      body: payload,
    });
  }

  async verifyMobileInProvider(
    payload: StrigaVerifyMobileRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.verifyMobile, {
      body: payload,
    });
  }

  async resendSmsInProvider(
    payload: StrigaResendSmsRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.resendSms, {
      body: payload,
    });
  }

  async startKycInProvider(
    payload: StrigaStartKycProviderRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.startKyc, {
      body: payload,
    });
  }

  async findWalletAccountFromProvider(
    payload: StrigaGetWalletAccountRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getWalletAccount, {
      body: payload,
    });
  }

  async findWalletAccountStatementFromProvider(
    payload: StrigaGetWalletAccountStatementRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getWalletAccountStatement, {
      body: payload,
    });
  }

  async findAllWalletsFromProvider(
    payload: StrigaGetAllWalletsRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getAllWallets, {
      body: payload,
    });
  }

  async findWalletFromProvider(
    payload: StrigaGetWalletRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getWallet, {
      body: payload,
    });
  }

  async createWalletInProvider(
    payload: StrigaCreateWalletRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.createWallet, {
      body: payload,
    });
  }
}
