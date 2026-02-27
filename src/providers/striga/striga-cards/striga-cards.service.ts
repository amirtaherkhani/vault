import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaUser } from '../striga-users/domain/striga-user';

import {
  // common
  Injectable,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateStrigaCardDto } from './dto/create-striga-card.dto';
import { UpdateStrigaCardDto } from './dto/update-striga-card.dto';
import { StrigaCardRepository } from './infrastructure/persistence/striga-card.repository';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import { StrigaCard, StrigaCardType } from './domain/striga-card';

@Injectable()
export class StrigaCardsService {
  constructor(
    private readonly strigaUserService: StrigaUsersService,

    // Dependencies here
    private readonly strigaCardRepository: StrigaCardRepository,
  ) {}

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

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.strigaCardRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: StrigaCard['id']) {
    return this.strigaCardRepository.findById(id);
  }

  findByExternalId(externalId: NonNullable<StrigaCard['externalId']>) {
    return this.strigaCardRepository.findByExternalId(externalId);
  }

  findByIds(ids: StrigaCard['id'][]) {
    return this.strigaCardRepository.findByIds(ids);
  }

  findByStrigaUserIdOrExternalId(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    return this.strigaCardRepository.findByStrigaUserIdOrExternalId(
      userId,
      externalId,
    );
  }

  findByParentWalletId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
  ) {
    return this.strigaCardRepository.findByParentWalletId(parentWalletId);
  }

  findByLinkedAccountId(
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ) {
    return this.strigaCardRepository.findByLinkedAccountId(linkedAccountId);
  }

  findByParentWalletIdAndLinkedAccountId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ) {
    return this.strigaCardRepository.findByParentWalletIdAndLinkedAccountId(
      parentWalletId,
      linkedAccountId,
    );
  }

  findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
    linkedAccountCurrency: NonNullable<StrigaCard['linkedAccountCurrency']>,
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    return this.strigaCardRepository.findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
      linkedAccountCurrency,
      userId,
      externalId,
    );
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
}
