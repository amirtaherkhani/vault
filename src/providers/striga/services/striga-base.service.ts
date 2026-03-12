import { RequestInput } from 'src/common/api-gateway/types/api-gateway.type';
import {
  StrigaBlockCardRequestDto,
  StrigaBurnCardRequestDto,
  StrigaCardIdRequestDto,
  StrigaCreateCardRequestDto,
  StrigaCreateUserRequestDto,
  StrigaCreateWalletRequestDto,
  StrigaGetCardsByUserRequestDto,
  StrigaGetCardStatementRequestDto,
  StrigaGetAccountTransactionsByIdRequestDto,
  StrigaGetAllWalletsRequestDto,
  StrigaGetWalletAccountRequestDto,
  StrigaGetWalletAccountStatementRequestDto,
  StrigaGetWalletRequestDto,
  StrigaLinkCardAccountRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaSetCardPinRequestDto,
  StrigaUpdateCard3dsRequestDto,
  StrigaUpdateCardLimitsRequestDto,
  StrigaUpdateCardSecurityRequestDto,
  StrigaUpdateUserRequestDto,
  StrigaUpdateVerifiedCredentialsRequestDto,
  StrigaUserByEmailRequestDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from '../dto/striga-base.request.dto';
import { StrigaBaseResponseDto } from '../dto/striga-base.response.dto';
import {
  buildFindAllWalletsPayload,
  extractWalletAccountsByCurrenciesFromPayload,
  resolveWalletsDateRangeFromProviderUser,
  StrigaWalletAccountSummary,
} from '../helpers/striga-wallet.helper';
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

  getCardCreateAssetNames(): string[] {
    return this.strigaService.getCardCreateAssetNames();
  }

  getCardDefaultPassword(): string {
    return this.strigaService.getCardDefaultPassword();
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
    const providerPayload = {
      userId: payload.externalId,
      tier: payload.tier,
    };

    return this.signedRequest(STRIGA_ENDPOINT_NAME.startKyc, {
      body: providerPayload,
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

  async findAccountTransactionsByIdFromProvider(
    payload: StrigaGetAccountTransactionsByIdRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getTransactionsById, {
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

  async findWalletAccountsByCurrenciesFromProvider(
    payload: StrigaGetWalletRequestDto,
    currencyNames: string[],
  ): Promise<StrigaWalletAccountSummary[]> {
    const payloadRecord =
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};
    const walletId = String(payloadRecord.walletId ?? '').trim();
    const userId = String(payloadRecord.userId ?? '').trim();

    try {
      const response = await this.findWalletFromProvider(payload);
      const accounts = extractWalletAccountsByCurrenciesFromPayload(
        response?.data,
        currencyNames,
        walletId || null,
      );
      if (accounts.length > 0) {
        return accounts;
      }
    } catch {
      // Fallback to /wallets/get/all below.
    }

    if (!userId) {
      return [];
    }

    let providerUser: Record<string, unknown> | null = null;
    try {
      const providerUserResponse = await this.findUserByIdFromProvider(userId);
      const data = providerUserResponse?.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        providerUser = data as Record<string, unknown>;
      }
    } catch {
      // Keep fallback date range based on request time.
    }

    const requestTs = Date.now();
    const dateRange = resolveWalletsDateRangeFromProviderUser(
      providerUser,
      requestTs,
    );
    const allWalletsPayload = buildFindAllWalletsPayload({
      userId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    const allWalletsResponse =
      await this.findAllWalletsFromProvider(allWalletsPayload);
    return extractWalletAccountsByCurrenciesFromPayload(
      allWalletsResponse?.data,
      currencyNames,
      walletId || null,
    );
  }

  async createWalletInProvider(
    payload: StrigaCreateWalletRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.createWallet, {
      body: payload,
    });
  }

  async createCardInProvider(
    payload: StrigaCreateCardRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.createCard, {
      body: payload,
    });
  }

  async findCardByIdFromProvider(
    payload: StrigaCardIdRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getCardById, {
      param: { cardId: payload.cardId },
    });
  }

  async burnCardInProvider(
    payload: StrigaBurnCardRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.burnCard, {
      body: payload,
    });
  }

  async blockCardInProvider(
    payload: StrigaBlockCardRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.blockCard, {
      body: payload,
    });
  }

  async unblockCardInProvider(
    payload: StrigaCardIdRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.unblockCard, {
      body: payload,
    });
  }

  async updateCard3dsInProvider(
    payload: StrigaUpdateCard3dsRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.updateCard3ds, {
      body: payload,
    });
  }

  async updateCardSecurityInProvider(
    payload: StrigaUpdateCardSecurityRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.updateCardSecurity, {
      body: payload,
    });
  }

  async setCardPinInProvider(
    payload: StrigaSetCardPinRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.setCardPin, {
      body: payload,
    });
  }

  async updateCardLimitsInProvider(
    payload: StrigaUpdateCardLimitsRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.updateCardLimits, {
      body: payload,
    });
  }

  async findCardStatementFromProvider(
    payload: StrigaGetCardStatementRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getCardStatement, {
      body: payload,
    });
  }

  async findCardsByUserFromProvider(
    payload: StrigaGetCardsByUserRequestDto,
  ): Promise<StrigaBaseResponseDto> {
    return this.signedRequest(STRIGA_ENDPOINT_NAME.getCardsByUser, {
      body: payload,
    });
  }
}
