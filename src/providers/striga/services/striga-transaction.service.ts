import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StrigaService } from '../striga.service';
import { StrigaBaseService } from './striga-base.service';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaUser } from '../striga-users/domain/striga-user';
import { RequestWithUser } from '../../../utils/types/object.type';
import { StrigaCardsService } from '../striga-cards/striga-cards.service';
import { StrigaCard } from '../striga-cards/domain/striga-card';
import {
  StrigaAccountStatementByAssetForAdminDto,
  StrigaAccountStatementByAssetForMeDto,
  StrigaAccountStatementByIdForAdminDto,
  StrigaAccountStatementByIdForMeDto,
  StrigaCardStatementForAdminDto,
  StrigaCardStatementForMeDto,
} from '../striga-cards/dto/striga-card-transaction.dto';
import { normalizeSupportedCurrency } from '../helpers/striga-currency.helper';
import { StrigaBaseResponseDto } from '../dto/striga-base.response.dto';
import { AccountsService } from '../../../accounts/accounts.service';
import { AccountProviderName } from '../../../accounts/types/account-enum.type';
import { RoleEnum } from '../../../roles/roles.enum';
import {
  isAccountOwnedByAppUser,
  isAccountOwnedByStrigaUser,
} from '../helpers/striga-account.helper';

@Injectable()
export class StrigaTransactionService extends StrigaBaseService {
  private readonly logger = new Logger(StrigaTransactionService.name);

  constructor(
    strigaService: StrigaService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly strigaCardsService: StrigaCardsService,
    private readonly accountsService: AccountsService,
  ) {
    super(strigaService);
  }

  async findAccountStatementForMe(
    req: RequestWithUser,
    payload: StrigaAccountStatementByIdForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(req.user?.id);
    const accountId = await this.resolveAccountIdForUser(
      payload.accountId,
      strigaUser,
    );

    return this.findWalletAccountStatementFromProvider({
      userId: strigaUser.externalId,
      accountId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  async findAccountStatementForAdmin(
    payload: StrigaAccountStatementByIdForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(payload.userId);
    const accountId = await this.resolveAccountIdForUser(
      payload.accountId,
      strigaUser,
    );

    return this.findWalletAccountStatementFromProvider({
      userId: strigaUser.externalId,
      accountId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  async findAccountStatementByAssetForMe(
    req: RequestWithUser,
    payload: StrigaAccountStatementByAssetForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(req.user?.id);
    const accountId = await this.resolveAccountIdByCurrency(
      strigaUser,
      payload.currency,
    );

    return this.findWalletAccountStatementFromProvider({
      userId: strigaUser.externalId,
      accountId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  async findAccountStatementByAssetForAdmin(
    payload: StrigaAccountStatementByAssetForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(payload.userId);
    const accountId = await this.resolveAccountIdByCurrency(
      strigaUser,
      payload.currency,
    );

    return this.findWalletAccountStatementFromProvider({
      userId: strigaUser.externalId,
      accountId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  async findCardStatementForMe(
    req: RequestWithUser,
    payload: StrigaCardStatementForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(req.user?.id);
    const card = await this.resolveCardForUser(payload.cardId, strigaUser);
    const externalCardId = String(card.externalId ?? '').trim();
    if (!externalCardId) {
      throw new BadRequestException('Card is missing provider identifier.');
    }

    return this.findCardStatementFromProvider({
      cardId: externalCardId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  async findCardStatementForAdmin(
    payload: StrigaCardStatementForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    const strigaUser = await this.resolveStrigaUserForAppUser(payload.userId);
    const card = await this.resolveCardForUser(payload.cardId, strigaUser);
    const externalCardId = String(card.externalId ?? '').trim();
    if (!externalCardId) {
      throw new BadRequestException('Card is missing provider identifier.');
    }

    return this.findCardStatementFromProvider({
      cardId: externalCardId,
      startDate: payload.startDate,
      endDate: payload.endDate,
      page: payload.page,
      limit: payload.limit,
    });
  }

  private async resolveStrigaUserForAppUser(
    appUserId?: number | string | null,
  ): Promise<StrigaUser> {
    const normalizedId =
      typeof appUserId === 'string'
        ? Number.parseInt(appUserId, 10)
        : appUserId;

    if (!normalizedId || Number.isNaN(normalizedId)) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(normalizedId);
    if (!strigaUser || !strigaUser.externalId) {
      throw new NotFoundException('Striga user not found.');
    }

    return strigaUser;
  }

  private async resolveCardForUser(
    cardId: StrigaCard['id'],
    strigaUser: StrigaUser,
  ): Promise<StrigaCard> {
    const cards = await this.strigaCardsService.findByStrigaUserIdOrExternalId(
      strigaUser.id,
      strigaUser.externalId,
    );
    const card = cards.find((item) => item.id === cardId);
    if (!card) {
      throw new NotFoundException('Card not found for user.');
    }
    if (!card.externalId) {
      throw new BadRequestException('Card is missing provider identifier.');
    }
    return card;
  }

  private async resolveAccountIdForUser(
    accountId: string,
    strigaUser: StrigaUser,
  ): Promise<string> {
    const account = await this.accountsService.findDomainByAccountId(accountId);

    if (!account || account.providerName !== AccountProviderName.STRIGA) {
      throw new NotFoundException('Account not found for user.');
    }

    const ownedByAppUser = isAccountOwnedByAppUser(account, strigaUser);
    const ownedByStrigaUser = isAccountOwnedByStrigaUser(account, strigaUser);

    if (!ownedByAppUser && !ownedByStrigaUser) {
      throw new NotFoundException('Account not found for user.');
    }

    return accountId;
  }

  private async resolveAccountIdByCurrency(
    strigaUser: StrigaUser,
    currency: string,
  ): Promise<string> {
    const normalizedCurrency = normalizeSupportedCurrency(currency);
    const cards = await this.strigaCardsService.findByStrigaUserIdOrExternalId(
      strigaUser.id,
      strigaUser.externalId,
    );

    const card = cards.find(
      (item) => item.linkedAccountCurrency === normalizedCurrency,
    );

    if (!card?.linkedAccountId) {
      throw new NotFoundException('Account not found for currency.');
    }

    return card.linkedAccountId;
  }
}
