import { StrigaUser } from '../../../../domain/striga-user';

import { StrigaUserEntity } from '../entities/striga-user.entity';

export class StrigaUserMapper {
  static toDomain(raw: StrigaUserEntity): StrigaUser {
    const domainEntity = new StrigaUser();
    domainEntity.externalId = raw.externalId;

    domainEntity.email = raw.email;

    domainEntity.lastName = raw.lastName;

    domainEntity.firstName = raw.firstName;

    domainEntity.mobile = raw.mobile;

    domainEntity.address = raw.address;

    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: StrigaUser): StrigaUserEntity {
    const persistenceEntity = new StrigaUserEntity();
    persistenceEntity.externalId = domainEntity.externalId;

    persistenceEntity.email = domainEntity.email;

    persistenceEntity.lastName = domainEntity.lastName;

    persistenceEntity.firstName = domainEntity.firstName;

    persistenceEntity.mobile = domainEntity.mobile;

    persistenceEntity.address = domainEntity.address;

    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
