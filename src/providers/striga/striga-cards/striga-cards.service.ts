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
import { StrigaCard, StrigaCardType } from './domain/striga-card';
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
    if (!card.externalId) {
      throw new BadRequestException('Card externalId is required.');
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
