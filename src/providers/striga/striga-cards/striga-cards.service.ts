import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaUser } from '../striga-users/domain/striga-user';

import {
  // common
  Injectable,
  HttpStatus,
  UnprocessableEntityException,
  BadRequestException,
} from '@nestjs/common';
import { CreateStrigaCardDto } from './dto/create-striga-card.dto';
import { UpdateStrigaCardDto } from './dto/update-striga-card.dto';
import { StrigaCardRepository } from './infrastructure/persistence/striga-card.repository';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import {
  StrigaCard,
  StrigaCardBlockType,
  StrigaCardStatus,
  StrigaCardType,
} from './domain/striga-card';
import { GroupPlainToInstances } from '../../../utils/transformers/class.transformer';
import { RoleEnum } from '../../../roles/roles.enum';
import { AccountsService } from '../../../accounts/accounts.service';
import { AccountProviderName } from '../../../accounts/types/account-enum.type';
import { RequestWithUser } from '../../../utils/types/object.type';
import { normalizeSupportedCurrency } from '../helpers/striga-currency.helper';
import { StrigaService } from '../striga.service';
import { StrigaBaseService } from '../services/striga-base.service';
import { StrigaSetCardPinRequestDto } from '../dto/striga-base.request.dto';
import {
  StrigaCardPinResultDto,
  StrigaSetCardPinForAdminDto,
  StrigaSetCardPinForMeDto,
} from './dto/striga-card-pin.dto';
import {
  StrigaCardFreezeStateDto,
  StrigaCardFreezeStatusDto,
  StrigaToggleCardFreezeForAdminDto,
  StrigaToggleCardFreezeForMeDto,
} from './dto/striga-card-freeze.dto';
import {
  StrigaUpdateCardSecurityForAdminDto,
  StrigaUpdateCardSecurityForMeDto,
  StrigaUpdateCardSecurityResultDto,
} from './dto/striga-card-security.dto';
import { StrigaCardSecuritySettingsRequestDto } from '../dto/striga-base.request.dto';
import { StrigaCardSecurity, StrigaCardLimits } from './domain/striga-card';
import {
  StrigaUpdateCardLimitsForAdminDto,
  StrigaUpdateCardLimitsForMeDto,
  StrigaUpdateCardLimitsResultDto,
  StrigaResetCardLimitsForAdminDto,
  StrigaResetCardLimitsForMeDto,
} from './dto/striga-card-limits.dto';
import { StrigaCardLimitsRequestDto } from '../dto/striga-base.request.dto';
import { StrigaCardMapper } from './infrastructure/persistence/relational/mappers/striga-card.mapper';

@Injectable()
export class StrigaCardsService extends StrigaBaseService {
  constructor(
    strigaService: StrigaService,
    private readonly strigaUserService: StrigaUsersService,

    // Dependencies here
    private readonly accountsService: AccountsService,
    private readonly strigaCardRepository: StrigaCardRepository,
  ) {
    super(strigaService);
  }

  async create(createStrigaCardDto: CreateStrigaCardDto) {
    // Do not remove comment below.
    // <creating-property />

    const userObject = await this.strigaUserService.findById(
      createStrigaCardDto.user.id,
    );
    if (!userObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notExists',
        },
      });
    }
    const user = userObject;

    return this.strigaCardRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      externalId: createStrigaCardDto.externalId,
      status: createStrigaCardDto.status,
      type: createStrigaCardDto.type ?? StrigaCardType.VIRTUAL,
      maskedCardNumber: createStrigaCardDto.maskedCardNumber,
      expiryData: createStrigaCardDto.expiryData,
      isEnrolledFor3dSecure: createStrigaCardDto.isEnrolledFor3dSecure,
      isCard3dSecureActivated: createStrigaCardDto.isCard3dSecureActivated,
      security: createStrigaCardDto.security,
      linkedAccountId: createStrigaCardDto.linkedAccountId,
      parentWalletId: createStrigaCardDto.parentWalletId,
      linkedAccountCurrency: createStrigaCardDto.linkedAccountCurrency,
      limits: createStrigaCardDto.limits,
      blockType: createStrigaCardDto.blockType,

      user,
    });
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    const rows = await this.strigaCardRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
    return GroupPlainToInstances(StrigaCard, rows, [
      RoleEnum.admin,
      RoleEnum.user,
    ]);
  }

  async findById(id: StrigaCard['id']) {
    const card = await this.strigaCardRepository.findById(id);
    if (!card) return null;
    const [result] = GroupPlainToInstances(
      StrigaCard,
      [card],
      [RoleEnum.admin, RoleEnum.user],
    );
    return result ?? null;
  }

  async findByExternalId(externalId: NonNullable<StrigaCard['externalId']>) {
    return this.strigaCardRepository.findByExternalId(externalId);
  }

  async findByIds(ids: StrigaCard['id'][]) {
    return this.strigaCardRepository.findByIds(ids);
  }

  async findByStrigaUserIdOrExternalId(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    return this.strigaCardRepository.findByStrigaUserIdOrExternalId(
      userId,
      externalId,
    );
  }

  async setCardPinForMe(
    req: RequestWithUser,
    payload: StrigaSetCardPinForMeDto,
  ): Promise<StrigaCardPinResultDto> {
    const appUserId = req.user?.id;
    const strigaUser = await this.strigaUserService.findByUserId(appUserId);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }

    const card = await this.findUserCardOrFail(payload.cardId, strigaUser);
    const providerPayload: StrigaSetCardPinRequestDto = {
      cardId: card.externalId!,
      pin: payload.pin,
    };

    const response = await this.setCardPinInProvider(providerPayload);
    return { updated: response?.success === true };
  }

  async toggleCardFreezeForMe(
    req: RequestWithUser,
    payload: StrigaToggleCardFreezeForMeDto,
  ): Promise<StrigaCardFreezeStatusDto> {
    const strigaUser = await this.strigaUserService.findByUserId(req.user?.id);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }

    const card = await this.findUserCardOrFail(payload.cardId, strigaUser);
    const previousStatus = card.status ?? null;

    await this.invokeCardFreeze(card, payload.freeze);

    const refreshed = await this.refreshCardFromProvider(card);
    const updatedStatus = refreshed?.status ?? previousStatus;
    const blockType = refreshed?.blockType ?? card.blockType ?? null;

    return {
      previousStatus,
      updatedStatus,
      cardId: card.id,
      blockType,
    };
  }

  async toggleCardFreezeForAdmin(
    payload: StrigaToggleCardFreezeForAdminDto,
  ): Promise<StrigaCardFreezeStatusDto> {
    const strigaUser = await this.strigaUserService.findByUserId(
      payload.userId,
    );
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }

    const card = await this.findUserCardOrFail(payload.cardId, strigaUser);
    const previousStatus = card.status ?? null;

    await this.invokeCardFreeze(card, payload.freeze);

    const refreshed = await this.refreshCardFromProvider(card);
    const updatedStatus = refreshed?.status ?? previousStatus;
    const blockType = refreshed?.blockType ?? card.blockType ?? null;

    return {
      previousStatus,
      updatedStatus,
      cardId: card.id,
      blockType,
    };
  }

  async getCardFreezeStateForMe(
    req: RequestWithUser,
    cardId: string,
  ): Promise<StrigaCardFreezeStateDto> {
    const strigaUser = await this.strigaUserService.findByUserId(req.user?.id);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    const card = await this.findUserCardOrFail(cardId, strigaUser);
    return StrigaCardMapper.toFreezeStateDto(card);
  }

  async getCardFreezeStateForAdmin(
    userId: number,
    cardId: string,
  ): Promise<StrigaCardFreezeStateDto> {
    const strigaUser = await this.strigaUserService.findByUserId(userId);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    const card = await this.findUserCardOrFail(cardId, strigaUser);
    return StrigaCardMapper.toFreezeStateDto(card);
  }

  async setCardPinForAdmin(
    payload: StrigaSetCardPinForAdminDto,
  ): Promise<StrigaCardPinResultDto> {
    const strigaUser = await this.strigaUserService.findByUserId(
      payload.userId,
    );
    if (!strigaUser?.externalId) {
      throw new BadRequestException('Striga user not found.');
    }

    const card = await this.findUserCardOrFail(payload.cardId, strigaUser);
    const providerPayload: StrigaSetCardPinRequestDto = {
      cardId: card.externalId!,
      pin: payload.pin,
    };

    const response = await this.setCardPinInProvider(providerPayload);
    return { updated: response?.success === true };
  }

  async updateCardLimitsForMe(
    req: RequestWithUser,
    payload: StrigaUpdateCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const strigaUser = await this.strigaUserService.findByUserId(req.user?.id);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    return this.updateCardLimitsInternal(
      strigaUser,
      payload.limits,
      payload.cardId,
    );
  }

  async resetCardLimitsForMe(
    req: RequestWithUser,
    payload: StrigaUpdateCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroLimits();
    return this.updateCardLimitsForMe(req, {
      cardId: payload.cardId,
      limits: zeroLimits,
    });
  }

  async updateCardLimitsForAdmin(
    payload: StrigaUpdateCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const strigaUser = await this.strigaUserService.findByUserId(
      payload.userId,
    );
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    return this.updateCardLimitsInternal(
      strigaUser,
      payload.limits,
      payload.cardId,
    );
  }

  async resetCardLimitsForAdmin(
    payload: StrigaUpdateCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroLimits();
    return this.updateCardLimitsForAdmin({
      ...payload,
      limits: zeroLimits,
    });
  }

  async resetWithdrawalLimitsForMe(
    req: RequestWithUser,
    payload: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroWithdrawalLimits();
    return this.updateCardLimitsForMe(req, {
      cardId: payload.cardId,
      limits: zeroLimits,
    });
  }

  async resetPurchaseLimitsForMe(
    req: RequestWithUser,
    payload: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroPurchaseLimits();
    return this.updateCardLimitsForMe(req, {
      cardId: payload.cardId,
      limits: zeroLimits,
    });
  }

  async resetTransactionLimitsForMe(
    req: RequestWithUser,
    payload: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroTransactionLimits();
    return this.updateCardLimitsForMe(req, {
      cardId: payload.cardId,
      limits: zeroLimits,
    });
  }

  async resetWithdrawalLimitsForAdmin(
    payload: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroWithdrawalLimits();
    return this.updateCardLimitsForAdmin({
      ...payload,
      limits: zeroLimits,
    });
  }

  async resetPurchaseLimitsForAdmin(
    payload: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroPurchaseLimits();
    return this.updateCardLimitsForAdmin({
      ...payload,
      limits: zeroLimits,
    });
  }

  async resetTransactionLimitsForAdmin(
    payload: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const zeroLimits = this.buildZeroTransactionLimits();
    return this.updateCardLimitsForAdmin({
      ...payload,
      limits: zeroLimits,
    });
  }

  async updateCardSecurityForMe(
    req: RequestWithUser,
    payload: StrigaUpdateCardSecurityForMeDto,
  ): Promise<StrigaUpdateCardSecurityResultDto> {
    const strigaUser = await this.strigaUserService.findByUserId(req.user?.id);
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    return this.updateCardSecurityInternal(strigaUser, payload);
  }

  async updateCardSecurityForAdmin(
    payload: StrigaUpdateCardSecurityForAdminDto,
  ): Promise<StrigaUpdateCardSecurityResultDto> {
    const strigaUser = await this.strigaUserService.findByUserId(
      payload.userId,
    );
    if (!strigaUser) {
      throw new BadRequestException('Striga user not found.');
    }
    return this.updateCardSecurityInternal(strigaUser, payload);
  }

  private async findUserCardOrFail(
    cardId: string,
    strigaUser: StrigaUser,
  ): Promise<StrigaCard> {
    const cards =
      await this.strigaCardRepository.findByStrigaUserIdOrExternalId(
        strigaUser.id,
        strigaUser.externalId,
      );
    const card = cards.find((item) => item.id === cardId);
    if (!card) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: { card: 'notExists' },
      });
    }
    return card;
  }

  private async updateCardSecurityInternal(
    strigaUser: StrigaUser,
    payload: StrigaUpdateCardSecurityForMeDto,
  ): Promise<StrigaUpdateCardSecurityResultDto> {
    const card = await this.findUserCardOrFail(payload.cardId, strigaUser);
    const externalId = card.externalId;
    if (!externalId) {
      throw new BadRequestException('Card externalId is required.');
    }

    const providerPayload = {
      cardId: externalId,
      security: payload.security,
    };

    const response = await this.updateCardSecurityInProvider(providerPayload);
    const data = (response?.data ?? {}) as Record<string, any>;
    const providerSecurity = (data.security ??
      null) as StrigaCardSecurity | null;
    const mergedSecurity = this.mergeSecuritySettings(
      providerSecurity,
      payload.security,
      card.security ?? undefined,
    );
    const status =
      (data.status as StrigaCardStatus | undefined) ?? card.status ?? null;
    const blockType =
      (data.blockType as StrigaCardBlockType | undefined) ??
      card.blockType ??
      null;

    await this.strigaCardRepository.update(card.id, {
      security: mergedSecurity,
      status,
      blockType,
    });

    return {
      updated: response?.success === true,
      cardId: card.id,
      security: mergedSecurity,
      status,
      blockType,
    };
  }

  private async updateCardLimitsInternal(
    strigaUser: StrigaUser,
    limits: StrigaCardLimitsRequestDto,
    cardId: string,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    const card = await this.findUserCardOrFail(cardId, strigaUser);
    const externalId = card.externalId;
    if (!externalId) {
      throw new BadRequestException('Card externalId is required.');
    }

    const response = await this.updateCardLimitsInProvider({
      cardId: externalId,
      limits,
    });
    const data = (response?.data ?? {}) as Record<string, any>;
    const providerLimits = (data.limits ?? null) as StrigaCardLimits | null;
    const mergedLimits = this.mergeLimits(
      providerLimits,
      limits,
      card.limits ?? undefined,
    );
    const status =
      (data.status as StrigaCardStatus | undefined) ?? card.status ?? null;
    const blockType =
      (data.blockType as StrigaCardBlockType | undefined) ??
      card.blockType ??
      null;

    await this.strigaCardRepository.update(card.id, {
      limits: mergedLimits,
      status,
      blockType,
    });

    return {
      updated: response?.success === true,
      cardId: card.id,
      limits: mergedLimits,
      status,
      blockType,
    };
  }

  private mergeSecuritySettings(
    providerSecurity: StrigaCardSecurity | null,
    requestedSecurity: StrigaCardSecuritySettingsRequestDto,
    currentSecurity?: StrigaCardSecurity,
  ): StrigaCardSecurity {
    const base: StrigaCardSecurity = {
      contactlessEnabled:
        providerSecurity?.contactlessEnabled ??
        requestedSecurity.contactlessEnabled ??
        currentSecurity?.contactlessEnabled ??
        false,
      withdrawalEnabled:
        providerSecurity?.withdrawalEnabled ??
        requestedSecurity.withdrawalEnabled ??
        currentSecurity?.withdrawalEnabled ??
        false,
      internetPurchaseEnabled:
        providerSecurity?.internetPurchaseEnabled ??
        requestedSecurity.internetPurchaseEnabled ??
        currentSecurity?.internetPurchaseEnabled ??
        false,
      overallLimitsEnabled:
        providerSecurity?.overallLimitsEnabled ??
        currentSecurity?.overallLimitsEnabled ??
        true,
    };
    return base;
  }

  private mergeLimits(
    providerLimits: StrigaCardLimits | null,
    requestedLimits: StrigaCardLimitsRequestDto,
    currentLimits?: StrigaCardLimits,
  ): StrigaCardLimits {
    const pick = (
      key: keyof StrigaCardLimitsRequestDto,
    ): number | undefined => {
      const providerValue = providerLimits?.[key as keyof StrigaCardLimits];
      if (typeof providerValue === 'number') return providerValue;
      const requestedValue = requestedLimits[key];
      if (typeof requestedValue === 'number') return requestedValue;
      const currentValue = currentLimits?.[key as keyof StrigaCardLimits];
      if (typeof currentValue === 'number') return currentValue as number;
      return undefined;
    };

    const limits: StrigaCardLimits = {
      dailyPurchase: pick('dailyPurchase'),
      dailyWithdrawal: pick('dailyWithdrawal'),
      dailyInternetPurchase: pick('dailyInternetPurchase'),
      dailyContactlessPurchase: pick('dailyContactlessPurchase'),
      weeklyPurchase: pick('weeklyPurchase'),
      weeklyWithdrawal: pick('weeklyWithdrawal'),
      weeklyInternetPurchase: pick('weeklyInternetPurchase'),
      weeklyContactlessPurchase: pick('weeklyContactlessPurchase'),
      monthlyPurchase: pick('monthlyPurchase'),
      monthlyWithdrawal: pick('monthlyWithdrawal'),
      monthlyInternetPurchase: pick('monthlyInternetPurchase'),
      monthlyContactlessPurchase: pick('monthlyContactlessPurchase'),
      transactionPurchase: pick('transactionPurchase'),
      transactionWithdrawal: pick('transactionWithdrawal'),
      transactionInternetPurchase: pick('transactionInternetPurchase'),
      transactionContactlessPurchase: pick('transactionContactlessPurchase'),
      dailyOverallPurchase: pick('dailyOverallPurchase'),
      weeklyOverallPurchase: pick('weeklyOverallPurchase'),
      monthlyOverallPurchase: pick('monthlyOverallPurchase'),
      dailyContactlessPurchaseAvailable:
        providerLimits?.dailyContactlessPurchaseAvailable ??
        currentLimits?.dailyContactlessPurchaseAvailable,
      dailyContactlessPurchaseUsed:
        providerLimits?.dailyContactlessPurchaseUsed ??
        currentLimits?.dailyContactlessPurchaseUsed,
      dailyInternetPurchaseAvailable:
        providerLimits?.dailyInternetPurchaseAvailable ??
        currentLimits?.dailyInternetPurchaseAvailable,
      dailyInternetPurchaseUsed:
        providerLimits?.dailyInternetPurchaseUsed ??
        currentLimits?.dailyInternetPurchaseUsed,
      dailyOverallPurchaseAvailable:
        providerLimits?.dailyOverallPurchaseAvailable ??
        currentLimits?.dailyOverallPurchaseAvailable,
      dailyOverallPurchaseUsed:
        providerLimits?.dailyOverallPurchaseUsed ??
        currentLimits?.dailyOverallPurchaseUsed,
      dailyPurchaseAvailable:
        providerLimits?.dailyPurchaseAvailable ??
        currentLimits?.dailyPurchaseAvailable,
      dailyPurchaseUsed:
        providerLimits?.dailyPurchaseUsed ?? currentLimits?.dailyPurchaseUsed,
      dailyWithdrawalAvailable:
        providerLimits?.dailyWithdrawalAvailable ??
        currentLimits?.dailyWithdrawalAvailable,
      dailyWithdrawalUsed:
        providerLimits?.dailyWithdrawalUsed ??
        currentLimits?.dailyWithdrawalUsed,
      monthlyContactlessPurchaseAvailable:
        providerLimits?.monthlyContactlessPurchaseAvailable ??
        currentLimits?.monthlyContactlessPurchaseAvailable,
      monthlyContactlessPurchaseUsed:
        providerLimits?.monthlyContactlessPurchaseUsed ??
        currentLimits?.monthlyContactlessPurchaseUsed,
      monthlyInternetPurchaseAvailable:
        providerLimits?.monthlyInternetPurchaseAvailable ??
        currentLimits?.monthlyInternetPurchaseAvailable,
      monthlyInternetPurchaseUsed:
        providerLimits?.monthlyInternetPurchaseUsed ??
        currentLimits?.monthlyInternetPurchaseUsed,
      monthlyOverallPurchaseAvailable:
        providerLimits?.monthlyOverallPurchaseAvailable ??
        currentLimits?.monthlyOverallPurchaseAvailable,
      monthlyOverallPurchaseUsed:
        providerLimits?.monthlyOverallPurchaseUsed ??
        currentLimits?.monthlyOverallPurchaseUsed,
      monthlyPurchaseAvailable:
        providerLimits?.monthlyPurchaseAvailable ??
        currentLimits?.monthlyPurchaseAvailable,
      monthlyPurchaseUsed:
        providerLimits?.monthlyPurchaseUsed ??
        currentLimits?.monthlyPurchaseUsed,
      monthlyWithdrawalAvailable:
        providerLimits?.monthlyWithdrawalAvailable ??
        currentLimits?.monthlyWithdrawalAvailable,
      monthlyWithdrawalUsed:
        providerLimits?.monthlyWithdrawalUsed ??
        currentLimits?.monthlyWithdrawalUsed,
      weeklyContactlessPurchaseAvailable:
        providerLimits?.weeklyContactlessPurchaseAvailable ??
        currentLimits?.weeklyContactlessPurchaseAvailable,
      weeklyContactlessPurchaseUsed:
        providerLimits?.weeklyContactlessPurchaseUsed ??
        currentLimits?.weeklyContactlessPurchaseUsed,
      weeklyInternetPurchaseAvailable:
        providerLimits?.weeklyInternetPurchaseAvailable ??
        currentLimits?.weeklyInternetPurchaseAvailable,
      weeklyInternetPurchaseUsed:
        providerLimits?.weeklyInternetPurchaseUsed ??
        currentLimits?.weeklyInternetPurchaseUsed,
      weeklyOverallPurchaseAvailable:
        providerLimits?.weeklyOverallPurchaseAvailable ??
        currentLimits?.weeklyOverallPurchaseAvailable,
      weeklyOverallPurchaseUsed:
        providerLimits?.weeklyOverallPurchaseUsed ??
        currentLimits?.weeklyOverallPurchaseUsed,
      weeklyPurchaseAvailable:
        providerLimits?.weeklyPurchaseAvailable ??
        currentLimits?.weeklyPurchaseAvailable,
      weeklyPurchaseUsed:
        providerLimits?.weeklyPurchaseUsed ?? currentLimits?.weeklyPurchaseUsed,
      weeklyWithdrawalAvailable:
        providerLimits?.weeklyWithdrawalAvailable ??
        currentLimits?.weeklyWithdrawalAvailable,
      weeklyWithdrawalUsed:
        providerLimits?.weeklyWithdrawalUsed ??
        currentLimits?.weeklyWithdrawalUsed,
    };

    return limits;
  }

  private buildZeroLimits(): StrigaCardLimitsRequestDto {
    const zero: StrigaCardLimitsRequestDto = {};
    const keys: (keyof StrigaCardLimitsRequestDto)[] = [
      'dailyPurchase',
      'dailyWithdrawal',
      'dailyInternetPurchase',
      'dailyContactlessPurchase',
      'weeklyPurchase',
      'weeklyWithdrawal',
      'weeklyInternetPurchase',
      'weeklyContactlessPurchase',
      'monthlyPurchase',
      'monthlyWithdrawal',
      'monthlyInternetPurchase',
      'monthlyContactlessPurchase',
      'transactionPurchase',
      'transactionWithdrawal',
      'transactionInternetPurchase',
      'transactionContactlessPurchase',
      'dailyOverallPurchase',
      'weeklyOverallPurchase',
      'monthlyOverallPurchase',
    ];
    keys.forEach((key) => {
      (zero as Record<string, number>)[key as string] = 0;
    });
    return zero;
  }

  private buildZeroWithdrawalLimits(): StrigaCardLimitsRequestDto {
    return {
      dailyWithdrawal: 0,
      weeklyWithdrawal: 0,
      monthlyWithdrawal: 0,
      transactionWithdrawal: 0,
    };
  }

  private buildZeroPurchaseLimits(): StrigaCardLimitsRequestDto {
    return {
      dailyPurchase: 0,
      weeklyPurchase: 0,
      monthlyPurchase: 0,
      dailyContactlessPurchase: 0,
      weeklyContactlessPurchase: 0,
      monthlyContactlessPurchase: 0,
      dailyOverallPurchase: 0,
      weeklyOverallPurchase: 0,
      monthlyOverallPurchase: 0,
    };
  }

  private buildZeroTransactionLimits(): StrigaCardLimitsRequestDto {
    return {
      transactionPurchase: 0,
      transactionWithdrawal: 0,
      transactionInternetPurchase: 0,
      transactionContactlessPurchase: 0,
    };
  }

  private async invokeCardFreeze(card: StrigaCard, freeze: boolean) {
    const externalId = card.externalId;
    if (!externalId) {
      throw new BadRequestException('Card externalId is required.');
    }

    if (freeze) {
      await this.blockCardInProvider({ cardId: externalId });
    } else {
      await this.unblockCardInProvider({ cardId: externalId });
    }
  }

  private async refreshCardFromProvider(
    card: StrigaCard,
  ): Promise<StrigaCard | null> {
    const externalId = card.externalId;
    if (!externalId) return null;
    try {
      const response = await this.findCardByIdFromProvider({
        cardId: externalId,
      });
      const data = response?.data as any;
      if (data && typeof data === 'object') {
        await this.strigaCardRepository.update(card.id, {
          status: (data.status as StrigaCardStatus | undefined) ?? card.status,
          blockType:
            (data.blockType as StrigaCardBlockType | undefined) ??
            card.blockType,
        });
        return {
          ...card,
          status: (data.status as StrigaCardStatus | undefined) ?? card.status,
          blockType:
            (data.blockType as StrigaCardBlockType | undefined) ??
            card.blockType,
        } as StrigaCard;
      }
    } catch {
      // ignore; fallback to local card
    }
    return card;
  }

  async findByParentWalletId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
  ) {
    return this.strigaCardRepository.findByParentWalletId(parentWalletId);
  }

  async findByLinkedAccountId(
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ) {
    return this.strigaCardRepository.findByLinkedAccountId(linkedAccountId);
  }

  async findByParentWalletIdAndLinkedAccountId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ) {
    return this.strigaCardRepository.findByParentWalletIdAndLinkedAccountId(
      parentWalletId,
      linkedAccountId,
    );
  }

  async findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
    linkedAccountCurrency: NonNullable<StrigaCard['linkedAccountCurrency']>,
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    const card =
      await this.strigaCardRepository.findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
        linkedAccountCurrency,
        userId,
        externalId,
      );
    if (!card) return null;
    const [result] = GroupPlainToInstances(
      StrigaCard,
      [card],
      [RoleEnum.admin, RoleEnum.user],
    );
    return result ?? null;
  }

  async update(
    id: StrigaCard['id'],

    updateStrigaCardDto: UpdateStrigaCardDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    let user: StrigaUser | undefined = undefined;

    if (updateStrigaCardDto.user) {
      const userObject = await this.strigaUserService.findById(
        updateStrigaCardDto.user.id,
      );
      if (!userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'notExists',
          },
        });
      }
      user = userObject;
    }

    return this.strigaCardRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      externalId: updateStrigaCardDto.externalId,
      status: updateStrigaCardDto.status,
      type: updateStrigaCardDto.type,
      maskedCardNumber: updateStrigaCardDto.maskedCardNumber,
      expiryData: updateStrigaCardDto.expiryData,
      isEnrolledFor3dSecure: updateStrigaCardDto.isEnrolledFor3dSecure,
      isCard3dSecureActivated: updateStrigaCardDto.isCard3dSecureActivated,
      security: updateStrigaCardDto.security,
      linkedAccountId: updateStrigaCardDto.linkedAccountId,
      parentWalletId: updateStrigaCardDto.parentWalletId,
      linkedAccountCurrency: updateStrigaCardDto.linkedAccountCurrency,
      limits: updateStrigaCardDto.limits,
      blockType: updateStrigaCardDto.blockType,

      user,
    });
  }

  remove(id: StrigaCard['id']) {
    return this.strigaCardRepository.remove(id);
  }

  async findForStrigaUserWithFilters(
    strigaUserId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
    filters?: {
      status?: StrigaCard['status'];
      linkedAccountCurrency?: StrigaCard['linkedAccountCurrency'];
      parentWalletId?: StrigaCard['parentWalletId'];
    },
  ) {
    const cards = await this.strigaCardRepository.findByStrigaUserWithFilters(
      strigaUserId,
      externalId,
      filters,
    );
    return GroupPlainToInstances(StrigaCard, cards, [
      RoleEnum.admin,
      RoleEnum.user,
    ]);
  }

  async findCardsForUserId(
    appUserId: number | undefined,
    filters?: {
      status?: StrigaCard['status'];
      linkedAccountCurrency?: StrigaCard['linkedAccountCurrency'];
      parentWalletId?: StrigaCard['parentWalletId'];
    },
  ) {
    if (typeof appUserId === 'undefined' || appUserId === null) {
      return [];
    }
    const strigaUser =
      await this.strigaUserService.resolveStrigaUserForMe(appUserId);
    if (!strigaUser) {
      return [];
    }
    return this.findForStrigaUserWithFilters(
      strigaUser.id,
      strigaUser.externalId,
      filters,
    );
  }

  async findCardsForMe(
    req: RequestWithUser,
    filters?: {
      status?: StrigaCard['status'];
      linkedAccountCurrency?: StrigaCard['linkedAccountCurrency'];
      parentWalletId?: StrigaCard['parentWalletId'];
    },
  ) {
    const appUserId = req?.user?.id as number | undefined;
    const normalizedFilters = {
      ...filters,
      linkedAccountCurrency: normalizeSupportedCurrency(
        filters?.linkedAccountCurrency as string | null | undefined,
      ) as StrigaCard['linkedAccountCurrency'],
    };
    return this.findCardsForUserId(appUserId, normalizedFilters);
  }

  async findCardByCurrencyForUserId(
    appUserId: number | undefined,
    currency: string,
  ) {
    const normalized = normalizeSupportedCurrency(currency);
    if (!normalized) return null;
    const strigaUser =
      await this.strigaUserService.resolveStrigaUserForMe(appUserId);
    if (!strigaUser?.externalId) {
      return null;
    }
    const card =
      await this.findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
        normalized,
        strigaUser.id,
        strigaUser.externalId,
      );
    return card;
  }

  async findCardByCurrencyForMe(req: RequestWithUser, currency: string) {
    const appUserId = req?.user?.id as number | undefined;
    return this.findCardByCurrencyForUserId(appUserId, currency);
  }

  async findCardAccountForUserId(
    appUserId: number | undefined,
    cardId: string,
  ) {
    const card = await this.findCardForUserId(appUserId, cardId);
    if (!card) return null;

    if (typeof appUserId === 'undefined') {
      return null;
    }

    const account = await this.accountsService
      .findByMeAndProviderName(appUserId, AccountProviderName.STRIGA)
      .catch(() => null);

    if (!account || account.accountId !== card.parentWalletId) {
      return null;
    }

    return account;
  }

  async findCardAccountForMe(req: RequestWithUser, cardId: string) {
    const appUserId = req?.user?.id as number | undefined;
    return this.findCardAccountForUserId(appUserId, cardId);
  }

  async findCardForUserId(
    appUserId: number | undefined,
    cardId: string,
  ): Promise<StrigaCard | null> {
    if (!appUserId || !cardId) return null;
    const strigaUser =
      await this.strigaUserService.resolveStrigaUserForMe(appUserId);
    if (!strigaUser) return null;

    const card = await this.strigaCardRepository.findById(cardId);
    if (!card) return null;
    if (
      card.user?.id !== strigaUser.id &&
      card.user?.externalId !== strigaUser.externalId
    ) {
      return null;
    }

    const [result] = GroupPlainToInstances(
      StrigaCard,
      [card],
      [RoleEnum.admin, RoleEnum.user],
    );
    return result ?? null;
  }

  async findCardForMe(
    req: RequestWithUser,
    cardId: string,
  ): Promise<StrigaCard | null> {
    const appUserId = req?.user?.id as number | undefined;
    return this.findCardForUserId(appUserId, cardId);
  }
}
