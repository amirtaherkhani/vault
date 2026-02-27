import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountsService } from '../../../accounts/accounts.service';
import { AccountProviderName } from '../../../accounts/types/account-enum.type';
import { InternalEventsService } from '../../../common/internal-events/internal-events.service';
import {
  StrigaCardIdRequestDto,
  StrigaCreateCardRequestDto,
  StrigaCreateCardType,
  StrigaGetCardsByUserRequestDto,
} from '../dto/striga-base.request.dto';
import {
  StrigaCardsByUserResponseDto,
  StrigaCreateCardResponseDto,
} from '../dto/striga-base.response.dto';
import {
  StrigaCardSyncCountersDto,
  StrigaCardSyncResultDto,
  StrigaProcessUserCardsWorkflowDto,
  StrigaSyncCardForWalletAccountWorkflowDto,
} from '../dto/striga-card-workflow.dto';
import { StrigaWalletAccountSummary } from '../helpers/striga-wallet.helper';
import { StrigaCard, StrigaCardType } from '../striga-cards/domain/striga-card';
import { CreateStrigaCardDto } from '../striga-cards/dto/create-striga-card.dto';
import { UpdateStrigaCardDto } from '../striga-cards/dto/update-striga-card.dto';
import { StrigaCardsService } from '../striga-cards/striga-cards.service';
import { StrigaUser } from '../striga-users/domain/striga-user';
import { StrigaCardEvent } from '../events/striga-card.event';
import { StrigaCardService } from './striga-card.service';

const STRIGA_CARD_NAME_ON_CARD = 'Vero Vault';
const STRIGA_CARDS_PAGE_LIMIT = 100;

@Injectable()
export class StrigaCardWorkflowService {
  private readonly logger = new Logger(StrigaCardWorkflowService.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly strigaCardService: StrigaCardService,
    private readonly strigaCardsService: StrigaCardsService,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Sync cards for user's primary Striga wallet with DB-first strategy.
   */
  async processUserCards(
    params: StrigaProcessUserCardsWorkflowDto,
  ): Promise<void> {
    const { strigaUser, appUserId, traceId, source } = params;

    if (!this.strigaCardService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Card workflow skipped because Striga service is disabled. Source=${source}.`,
      );
      return;
    }

    const localStrigaUserId = String(strigaUser.id ?? '').trim();
    const externalId = String(strigaUser.externalId ?? '').trim();
    if (!localStrigaUserId || !externalId) {
      this.logger.warn(
        `[trace=${traceId}] Card workflow skipped because local/external Striga user id is missing. Source=${source}.`,
      );
      return;
    }

    const walletId = await this.resolvePrimaryWalletId(
      appUserId,
      traceId,
      source,
    );
    if (!walletId) {
      return;
    }

    const providerCards = await this.findVirtualCardsByUserFromProvider(
      externalId,
      traceId,
    );
    const providerWalletCards = providerCards.filter(
      (card) => this.toNullableString(card.parentWalletId) === walletId,
    );

    const assetNames = this.resolveCardAssetNames();
    let walletAccounts: StrigaWalletAccountSummary[] = [];
    try {
      walletAccounts =
        await this.strigaCardService.findWalletAccountsByCurrenciesFromProvider(
          { walletId, userId: externalId },
          assetNames,
        );
      if (walletAccounts.length === 0) {
        this.logger.warn(
          `[trace=${traceId}] No wallet accounts matched configured assets=${assetNames.join(',')} walletId=${walletId}; card creation skipped. Source=${source}.`,
        );
        return;
      }
    } catch (error) {
      this.logger.error(
        `[trace=${traceId}] Wallets/get failed while resolving wallet accounts walletId=${walletId} reason=${this.formatError(error)} source=${source}.`,
      );
      return;
    }

    const defaultPassword = this.strigaCardService.getCardDefaultPassword();
    if (!defaultPassword) {
      this.logger.error(
        `[trace=${traceId}] Card creation skipped because STRIGA card default password is empty. Source=${source}.`,
      );
      return;
    }

    const counters = new StrigaCardSyncCountersDto();
    for (const walletAccount of walletAccounts) {
      try {
        const syncResult = await this.syncCardForWalletAccount({
          strigaUser,
          appUserId,
          externalId,
          walletId,
          walletAccount,
          providerWalletCards,
          defaultPassword,
          traceId,
          source,
        });

        if (syncResult.operation === 'updated') {
          counters.updated += 1;
        } else if (syncResult.operation === 'recovered') {
          counters.recovered += 1;
        } else if (syncResult.operation === 'created') {
          counters.created += 1;
        } else {
          counters.skipped += 1;
        }
      } catch (error) {
        counters.skipped += 1;
        this.logger.error(
          `[trace=${traceId}] Card sync failed walletId=${walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} reason=${this.formatError(error)} source=${source}.`,
        );
      }
    }

    this.logger.log(
      `[trace=${traceId}] Card workflow completed walletId=${walletId} updated=${counters.updated} recovered=${counters.recovered} created=${counters.created} skipped=${counters.skipped} cloudCards=${providerWalletCards.length} walletAccounts=${walletAccounts.length} source=${source}.`,
    );
  }

  private async resolvePrimaryWalletId(
    appUserId: number,
    traceId: string,
    source: string,
  ): Promise<string | null> {
    const localStrigaAccount = await this.accountsService
      .findByMeAndProviderName(appUserId, AccountProviderName.STRIGA)
      .catch(() => null);
    if (!localStrigaAccount) {
      this.logger.debug(
        `[trace=${traceId}] Card workflow skipped because local STRIGA account was not found for userId=${String(appUserId)}. Source=${source}.`,
      );
      return null;
    }

    const walletId = String(localStrigaAccount.accountId ?? '').trim();
    if (!walletId) {
      this.logger.warn(
        `[trace=${traceId}] Card workflow skipped because local STRIGA account exists but wallet id is empty. Source=${source}.`,
      );
      return null;
    }

    return walletId;
  }

  private async syncCardForWalletAccount(
    params: StrigaSyncCardForWalletAccountWorkflowDto,
  ): Promise<StrigaCardSyncResultDto> {
    const {
      strigaUser,
      appUserId,
      externalId,
      walletId,
      walletAccount,
      providerWalletCards,
      defaultPassword,
      traceId,
      source,
    } = params;

    const localCard = await this.findExistingLocalCard(strigaUser, {
      externalId: null,
      parentWalletId: walletId,
      linkedAccountId: walletAccount.accountId,
      linkedAccountCurrency: walletAccount.currency,
    });
    const cloudCard = providerWalletCards.find((card) =>
      this.matchesProviderCardToWalletAccount(card, walletAccount),
    );

    // DB first: local exists -> refresh from provider by externalId.
    if (localCard) {
      let providerCardByExternalId: StrigaCreateCardResponseDto | null = null;
      const localExternalId = this.toNullableString(localCard.externalId);
      if (localExternalId) {
        try {
          const getCardByIdPayload: StrigaCardIdRequestDto = {
            cardId: localExternalId,
          };
          const getCardByIdResponse =
            await this.strigaCardService.findCardByIdFromProvider(
              getCardByIdPayload,
            );
          providerCardByExternalId = this.toCardDto(getCardByIdResponse?.data);
        } catch (error) {
          this.logger.warn(
            `[trace=${traceId}] Could not refresh card by externalId=${localExternalId}; falling back to list payload. reason=${this.formatError(error)} source=${source}.`,
          );
        }
      }

      const effectiveCloudCard = providerCardByExternalId ?? cloudCard;
      if (!effectiveCloudCard) {
        this.logger.debug(
          `[trace=${traceId}] Local card exists and cloud card was not found walletId=${walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} type=${localCard.type} source=${source}.`,
        );
        return {
          operation: 'updated',
          type: localCard.type ?? StrigaCardType.VIRTUAL,
        };
      }

      const upserted = await this.upsertLocalCardFromProviderCard(
        strigaUser,
        effectiveCloudCard,
        traceId,
        `${source}:update-local`,
      );
      const type = this.toCardType(effectiveCloudCard.type);
      this.logger.debug(
        `[trace=${traceId}] Local card updated from cloud walletId=${walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} type=${type} result=${upserted.operation} source=${source} refreshByExternalId=${providerCardByExternalId ? 'yes' : 'no'}.`,
      );
      return { operation: 'updated', type };
    }

    // Local missing -> recover from cloud.
    if (cloudCard) {
      const upserted = await this.upsertLocalCardFromProviderCard(
        strigaUser,
        cloudCard,
        traceId,
        `${source}:recover`,
      );
      const type = this.toCardType(cloudCard.type);
      if (upserted.operation === 'created') {
        await this.internalEventsService.emit(
          this.dataSource.manager,
          StrigaCardEvent.cardAdded({
            source,
            appUserId,
            localStrigaUserId: this.toNullableString(strigaUser.id),
            externalId: this.toNullableString(strigaUser.externalId),
            localCardId: upserted.localCardId,
            cardId: this.toNullableString(cloudCard.id),
            parentWalletId:
              this.toNullableString(cloudCard.parentWalletId) ?? walletId,
            linkedAccountId:
              this.toNullableString(cloudCard.linkedAccountId) ??
              walletAccount.accountId,
            linkedAccountCurrency:
              this.toNullableString(cloudCard.linkedAccountCurrency) ??
              walletAccount.currency,
            type,
          }).getEvent(),
        );
      }
      this.logger.debug(
        `[trace=${traceId}] Recovered cloud card into local walletId=${walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} type=${type} result=${upserted.operation} source=${source}.`,
      );
      return { operation: 'recovered', type };
    }

    // Local + cloud missing -> create in cloud then save local.
    const createPayload: StrigaCreateCardRequestDto = {
      userId: externalId,
      nameOnCard: STRIGA_CARD_NAME_ON_CARD,
      type: StrigaCreateCardType.VIRTUAL,
      threeDSecurePassword: defaultPassword,
      accountIdToLink: walletAccount.accountId,
    };
    this.logger.debug(
      `[trace=${traceId}] Creating virtual card externalId=${externalId} walletId=${walletAccount.walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} source=${source}.`,
    );

    const createResponse =
      await this.strigaCardService.createCardInProvider(createPayload);
    const createdCard = this.toCardDto(createResponse?.data);
    if (!createdCard) {
      this.logger.warn(
        `[trace=${traceId}] Create card returned empty payload accountId=${walletAccount.accountId} currency=${walletAccount.currency} source=${source}.`,
      );
      return { operation: 'skipped', type: null };
    }

    createdCard.parentWalletId =
      createdCard.parentWalletId ?? walletAccount.walletId;
    createdCard.linkedAccountId =
      createdCard.linkedAccountId ?? walletAccount.accountId;
    createdCard.linkedAccountCurrency =
      createdCard.linkedAccountCurrency ?? walletAccount.currency;
    createdCard.type = createdCard.type ?? StrigaCardType.VIRTUAL;
    createdCard.userId = createdCard.userId ?? externalId;

    providerWalletCards.push(createdCard);
    const upserted = await this.upsertLocalCardFromProviderCard(
      strigaUser,
      createdCard,
      traceId,
      `${source}:create`,
    );
    const type = this.toCardType(createdCard.type);
    if (upserted.operation === 'created') {
      await this.internalEventsService.emit(
        this.dataSource.manager,
        StrigaCardEvent.cardCreated({
          source,
          appUserId,
          localStrigaUserId: this.toNullableString(strigaUser.id),
          externalId: this.toNullableString(strigaUser.externalId),
          localCardId: upserted.localCardId,
          cardId: this.toNullableString(createdCard.id),
          parentWalletId:
            this.toNullableString(createdCard.parentWalletId) ?? walletId,
          linkedAccountId:
            this.toNullableString(createdCard.linkedAccountId) ??
            walletAccount.accountId,
          linkedAccountCurrency:
            this.toNullableString(createdCard.linkedAccountCurrency) ??
            walletAccount.currency,
          type,
        }).getEvent(),
      );
    }
    this.logger.debug(
      `[trace=${traceId}] Created and saved card walletId=${walletId} accountId=${walletAccount.accountId} currency=${walletAccount.currency} type=${type} result=${upserted.operation} source=${source}.`,
    );

    return { operation: 'created', type };
  }

  private async findVirtualCardsByUserFromProvider(
    externalId: string,
    traceId: string,
  ): Promise<StrigaCreateCardResponseDto[]> {
    const cards: StrigaCreateCardResponseDto[] = [];
    let offset = 0;

    while (true) {
      const requestPayload: StrigaGetCardsByUserRequestDto = {
        userId: externalId,
        limit: STRIGA_CARDS_PAGE_LIMIT,
        offset,
      };
      const response =
        await this.strigaCardService.findCardsByUserFromProvider(
          requestPayload,
        );

      const page = this.extractCardsByUserData(response?.data);
      const pageCards = page.cards ?? [];
      const virtualCards = pageCards.filter(
        (card) => this.toCardType(card.type) === StrigaCardType.VIRTUAL,
      );
      cards.push(...virtualCards);

      this.logger.debug(
        `[trace=${traceId}] Card list page fetched externalId=${externalId} offset=${offset} count=${pageCards.length} total=${String(page.total ?? 'n/a')} virtualCount=${virtualCards.length}.`,
      );

      if (pageCards.length === 0) {
        break;
      }

      offset += pageCards.length;
      if (typeof page.total === 'number' && offset >= page.total) {
        break;
      }

      if (pageCards.length < STRIGA_CARDS_PAGE_LIMIT) {
        break;
      }
    }

    return cards;
  }

  private extractCardsByUserData(data: unknown): StrigaCardsByUserResponseDto {
    if (!data) {
      return { cards: [], total: 0 };
    }

    if (Array.isArray(data)) {
      const cards = data
        .map((item) => this.toCardDto(item))
        .filter((item): item is StrigaCreateCardResponseDto => item !== null);
      return { cards, total: cards.length };
    }

    if (typeof data !== 'object' || Array.isArray(data)) {
      return { cards: [], total: 0 };
    }

    const record = data as Record<string, unknown>;
    const cardsRaw = Array.isArray(record.cards) ? record.cards : [];
    const cards = cardsRaw
      .map((item) => this.toCardDto(item))
      .filter((item): item is StrigaCreateCardResponseDto => item !== null);

    const total =
      typeof record.total === 'number' && Number.isFinite(record.total)
        ? record.total
        : typeof record.count === 'number' && Number.isFinite(record.count)
          ? record.count
          : cards.length;

    if (cards.length > 0 || total > 0) {
      return { cards, total };
    }

    if (record.data) {
      return this.extractCardsByUserData(record.data);
    }

    if (record.result) {
      return this.extractCardsByUserData(record.result);
    }

    return { cards: [], total: 0 };
  }

  private async upsertLocalCardFromProviderCard(
    strigaUser: StrigaUser,
    providerCard: StrigaCreateCardResponseDto,
    traceId: string,
    source: string,
  ): Promise<{
    operation: 'created' | 'updated' | 'skipped';
    localCardId: string | null;
  }> {
    const payload = this.toCardWritePayload(providerCard);
    if (
      !payload.externalId &&
      !payload.linkedAccountId &&
      !payload.linkedAccountCurrency &&
      !payload.parentWalletId
    ) {
      this.logger.warn(
        `[trace=${traceId}] Local sync skipped because provider card payload is missing matching keys (linkedAccountId/linkedAccountCurrency/parentWalletId). Source=${source}.`,
      );
      return { operation: 'skipped', localCardId: null };
    }

    const existing = await this.findExistingLocalCard(strigaUser, payload);
    if (existing) {
      const updated = await this.strigaCardsService.update(
        existing.id,
        Object.assign(new UpdateStrigaCardDto(), payload),
      );
      return {
        operation: 'updated',
        localCardId:
          this.toNullableString(updated?.id) ??
          this.toNullableString(existing.id),
      };
    }

    const localStrigaUserId = String(strigaUser.id ?? '').trim();
    if (!localStrigaUserId) {
      this.logger.warn(
        `[trace=${traceId}] Local card create skipped because local Striga user id is missing. Source=${source}.`,
      );
      return { operation: 'skipped', localCardId: null };
    }

    const created = await this.strigaCardsService.create(
      Object.assign(new CreateStrigaCardDto(), payload, {
        user: { id: localStrigaUserId },
      }),
    );

    return {
      operation: 'created',
      localCardId: this.toNullableString(created?.id),
    };
  }

  private async findExistingLocalCard(
    strigaUser: StrigaUser,
    payload: {
      externalId?: string | null;
      parentWalletId?: string | null;
      linkedAccountId?: string | null;
      linkedAccountCurrency?: string | null;
    },
  ): Promise<StrigaCard | null> {
    const externalId = String(payload.externalId ?? '').trim();
    const parentWalletId = String(payload.parentWalletId ?? '').trim();
    const linkedAccountId = String(payload.linkedAccountId ?? '').trim();
    const linkedAccountCurrency = String(
      payload.linkedAccountCurrency ?? '',
    ).trim();

    if (externalId) {
      const byExternalId =
        await this.strigaCardsService.findByExternalId(externalId);
      if (byExternalId) {
        return byExternalId;
      }
    }

    if (parentWalletId && linkedAccountId) {
      const byWalletAndAccount =
        await this.strigaCardsService.findByParentWalletIdAndLinkedAccountId(
          parentWalletId,
          linkedAccountId,
        );
      if (byWalletAndAccount) {
        return byWalletAndAccount;
      }
    }

    if (linkedAccountId) {
      const byAccount =
        await this.strigaCardsService.findByLinkedAccountId(linkedAccountId);
      if (byAccount) {
        return byAccount;
      }
    }

    if (linkedAccountCurrency) {
      const byCurrency =
        await this.strigaCardsService.findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
          linkedAccountCurrency,
          strigaUser.id,
          strigaUser.externalId,
        );
      if (byCurrency) {
        return byCurrency;
      }
    }

    return null;
  }

  private matchesProviderCardToWalletAccount(
    providerCard: StrigaCreateCardResponseDto,
    walletAccount: StrigaWalletAccountSummary,
  ): boolean {
    const parentWalletId = this.toNullableString(providerCard.parentWalletId);
    if (parentWalletId && parentWalletId !== walletAccount.walletId) {
      return false;
    }

    const linkedAccountId = this.toNullableString(providerCard.linkedAccountId);
    if (linkedAccountId && linkedAccountId === walletAccount.accountId) {
      return true;
    }

    const linkedAccountCurrency = this.toNullableString(
      providerCard.linkedAccountCurrency,
    );
    return (
      linkedAccountCurrency !== null &&
      linkedAccountCurrency.toUpperCase() === walletAccount.currency
    );
  }

  private toCardWritePayload(providerCard: StrigaCreateCardResponseDto): {
    externalId: string | null;
    status: string | null;
    type: StrigaCardType;
    maskedCardNumber: string | null;
    expiryData: string | null;
    isEnrolledFor3dSecure: boolean | null;
    isCard3dSecureActivated: boolean | null;
    security: CreateStrigaCardDto['security'] | null;
    linkedAccountId: string | null;
    parentWalletId: string | null;
    linkedAccountCurrency: string | null;
    limits: CreateStrigaCardDto['limits'] | null;
    blockType: string | null;
  } {
    return {
      externalId: this.toNullableString(providerCard.id),
      status: this.toNullableString(providerCard.status),
      type: this.toCardType(providerCard.type),
      maskedCardNumber: this.toNullableString(providerCard.maskedCardNumber),
      expiryData: this.toNullableString(providerCard.expiryData),
      isEnrolledFor3dSecure: this.toNullableBoolean(
        providerCard.isEnrolledFor3dSecure,
      ),
      isCard3dSecureActivated: this.toNullableBoolean(
        providerCard.isCard3dSecureActivated,
      ),
      security: providerCard.security as CreateStrigaCardDto['security'],
      linkedAccountId: this.toNullableString(providerCard.linkedAccountId),
      parentWalletId: this.toNullableString(providerCard.parentWalletId),
      linkedAccountCurrency: this.toNullableString(
        providerCard.linkedAccountCurrency,
      ),
      limits: providerCard.limits as CreateStrigaCardDto['limits'],
      blockType: this.toNullableString(providerCard.blockType),
    };
  }

  private resolveCardAssetNames(): string[] {
    const configured = this.strigaCardService.getCardCreateAssetNames();
    if (configured.length > 0) {
      return configured;
    }

    return ['EUR'];
  }

  private toCardType(value: unknown): StrigaCardType {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    if (normalized === StrigaCardType.PHYSICAL) {
      return StrigaCardType.PHYSICAL;
    }

    return StrigaCardType.VIRTUAL;
  }

  private toCardDto(value: unknown): StrigaCreateCardResponseDto | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as StrigaCreateCardResponseDto;
  }

  private toNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toNullableBoolean(value: unknown): boolean | null {
    return typeof value === 'boolean' ? value : null;
  }

  private formatError(error: unknown): string {
    const asAny = error as any;
    const status =
      asAny?.status ??
      asAny?.response?.statusCode ??
      asAny?.response?.status ??
      asAny?.getStatus?.();
    const response =
      asAny?.response ??
      asAny?.getResponse?.() ??
      asAny?.message ??
      String(error);

    try {
      return `status=${status ?? 'n/a'} response=${JSON.stringify(response)}`;
    } catch {
      return `status=${status ?? 'n/a'} response=${String(response)}`;
    }
  }
}
