import { StrigaCard } from '../../../../domain/striga-card';

import { StrigaUserMapper } from '../../../../../striga-users/infrastructure/persistence/relational/mappers/striga-user.mapper';

import { StrigaCardEntity } from '../entities/striga-card.entity';

export class StrigaCardMapper {
  static toDomain(raw: StrigaCardEntity): StrigaCard {
    const domainEntity = new StrigaCard();
    domainEntity.status = raw.status;
    domainEntity.type = raw.type;
    domainEntity.maskedCardNumber = raw.maskedCardNumber;
    domainEntity.expiryData = raw.expiryData;
    domainEntity.isEnrolledFor3dSecure = raw.isEnrolledFor3dSecure;
    domainEntity.isCard3dSecureActivated = raw.isCard3dSecureActivated;
    domainEntity.security = raw.security;
    domainEntity.linkedAccountId = raw.linkedAccountId;
    domainEntity.parentWalletId = raw.parentWalletId;
    domainEntity.linkedAccountCurrency = raw.linkedAccountCurrency;
    domainEntity.limits = raw.limits;
    domainEntity.blockType = raw.blockType;

    if (raw.user) {
      domainEntity.user = StrigaUserMapper.toDomain(raw.user);
    }

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: StrigaCard): StrigaCardEntity {
    const persistenceEntity = new StrigaCardEntity();
    persistenceEntity.status = domainEntity.status;
    persistenceEntity.type = domainEntity.type;
    persistenceEntity.maskedCardNumber = domainEntity.maskedCardNumber;
    persistenceEntity.expiryData = domainEntity.expiryData;
    persistenceEntity.isEnrolledFor3dSecure =
      domainEntity.isEnrolledFor3dSecure;
    persistenceEntity.isCard3dSecureActivated =
      domainEntity.isCard3dSecureActivated;
    persistenceEntity.security = domainEntity.security;
    persistenceEntity.linkedAccountId = domainEntity.linkedAccountId;
    persistenceEntity.parentWalletId = domainEntity.parentWalletId;
    persistenceEntity.linkedAccountCurrency =
      domainEntity.linkedAccountCurrency;
    persistenceEntity.limits = domainEntity.limits;
    persistenceEntity.blockType = domainEntity.blockType;

    if (domainEntity.user) {
      persistenceEntity.user = StrigaUserMapper.toPersistence(
        domainEntity.user,
      );
    }

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
