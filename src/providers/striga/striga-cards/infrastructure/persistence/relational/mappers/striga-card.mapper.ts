import { StrigaCard } from '../../../../domain/striga-card';
import { StrigaCardEntity } from '../entities/striga-card.entity';

export class StrigaCardMapper {
  static toDomain(raw: StrigaCardEntity): StrigaCard {
    const domainEntity = new StrigaCard();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: StrigaCard): StrigaCardEntity {
    const persistenceEntity = new StrigaCardEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
