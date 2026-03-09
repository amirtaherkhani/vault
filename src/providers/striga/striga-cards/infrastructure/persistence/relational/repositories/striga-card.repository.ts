import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StrigaCardEntity } from '../entities/striga-card.entity';
import { NullableType } from '../../../../../../../utils/types/nullable.type';
import { StrigaCard } from '../../../../domain/striga-card';
import { StrigaCardRepository } from '../../striga-card.repository';
import { StrigaCardMapper } from '../mappers/striga-card.mapper';
import { IPaginationOptions } from '../../../../../../../utils/types/pagination-options.type';
import { StrigaUser } from '../../../../../striga-users/domain/striga-user';

@Injectable()
export class StrigaCardRelationalRepository implements StrigaCardRepository {
  constructor(
    @InjectRepository(StrigaCardEntity)
    private readonly strigaCardRepository: Repository<StrigaCardEntity>,
  ) {}

  async create(data: StrigaCard): Promise<StrigaCard> {
    const persistenceModel = StrigaCardMapper.toPersistence(data);
    const newEntity = await this.strigaCardRepository.save(
      this.strigaCardRepository.create(persistenceModel),
    );
    return StrigaCardMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StrigaCard[]> {
    const entities = await this.strigaCardRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
  }

  async findById(id: StrigaCard['id']): Promise<NullableType<StrigaCard>> {
    const entity = await this.strigaCardRepository.findOne({
      where: { id },
    });

    return entity ? StrigaCardMapper.toDomain(entity) : null;
  }

  async findByExternalId(
    externalId: NonNullable<StrigaCard['externalId']>,
  ): Promise<NullableType<StrigaCard>> {
    const entity = await this.strigaCardRepository.findOne({
      where: { externalId },
      order: { createdAt: 'ASC' },
    });

    return entity ? StrigaCardMapper.toDomain(entity) : null;
  }

  async findByIds(ids: StrigaCard['id'][]): Promise<StrigaCard[]> {
    const entities = await this.strigaCardRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
  }

  async findByStrigaUserIdOrExternalId(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<StrigaCard[]> {
    if (!userId && !externalId) {
      return [];
    }

    const qb = this.strigaCardRepository
      .createQueryBuilder('strigaCard')
      .leftJoinAndSelect('strigaCard.user', 'strigaUser');

    if (userId) {
      qb.where('strigaUser.id = :userId', { userId });
    } else {
      qb.where('strigaUser.externalId = :externalId', { externalId });
    }

    const entities = await qb.getMany();
    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
  }

  async findByStrigaUserWithFilters(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
    filters?: {
      status?: StrigaCard['status'];
      linkedAccountCurrency?: StrigaCard['linkedAccountCurrency'];
      parentWalletId?: StrigaCard['parentWalletId'];
    },
  ): Promise<StrigaCard[]> {
    if (!userId && !externalId) {
      return [];
    }

    const qb = this.strigaCardRepository
      .createQueryBuilder('strigaCard')
      .leftJoinAndSelect('strigaCard.user', 'strigaUser')
      .orderBy('strigaCard.createdAt', 'ASC');

    if (userId) {
      qb.where('strigaUser.id = :userId', { userId });
    } else {
      qb.where('strigaUser.externalId = :externalId', { externalId });
    }

    if (filters?.status) {
      qb.andWhere('strigaCard.status = :status', { status: filters.status });
    }
    if (filters?.linkedAccountCurrency) {
      qb.andWhere('strigaCard.linkedAccountCurrency = :currency', {
        currency: filters.linkedAccountCurrency,
      });
    }
    if (filters?.parentWalletId) {
      qb.andWhere('strigaCard.parentWalletId = :parentWalletId', {
        parentWalletId: filters.parentWalletId,
      });
    }

    const entities = await qb.getMany();
    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
  }

  async findByParentWalletId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
  ): Promise<StrigaCard[]> {
    const entities = await this.strigaCardRepository.find({
      where: { parentWalletId },
    });

    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
  }

  async findByLinkedAccountId(
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ): Promise<NullableType<StrigaCard>> {
    const entity = await this.strigaCardRepository.findOne({
      where: { linkedAccountId },
      order: { createdAt: 'ASC' },
    });

    return entity ? StrigaCardMapper.toDomain(entity) : null;
  }

  async findByParentWalletIdAndLinkedAccountId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ): Promise<NullableType<StrigaCard>> {
    const entity = await this.strigaCardRepository.findOne({
      where: { parentWalletId, linkedAccountId },
      order: { createdAt: 'ASC' },
    });

    return entity ? StrigaCardMapper.toDomain(entity) : null;
  }

  async findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
    linkedAccountCurrency: NonNullable<StrigaCard['linkedAccountCurrency']>,
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaCard>> {
    if (!linkedAccountCurrency || (!userId && !externalId)) {
      return null;
    }

    const qb = this.strigaCardRepository
      .createQueryBuilder('strigaCard')
      .leftJoinAndSelect('strigaCard.user', 'strigaUser')
      .where('strigaCard.linkedAccountCurrency = :linkedAccountCurrency', {
        linkedAccountCurrency,
      })
      .orderBy('strigaCard.createdAt', 'ASC')
      .limit(1);

    if (userId) {
      qb.andWhere('strigaUser.id = :userId', { userId });
    } else {
      qb.andWhere('strigaUser.externalId = :externalId', { externalId });
    }

    const entity = await qb.getOne();
    return entity ? StrigaCardMapper.toDomain(entity) : null;
  }

  async update(
    id: StrigaCard['id'],
    payload: Partial<StrigaCard>,
  ): Promise<StrigaCard> {
    const entity = await this.strigaCardRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.strigaCardRepository.save(
      this.strigaCardRepository.create(
        StrigaCardMapper.toPersistence({
          ...StrigaCardMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return StrigaCardMapper.toDomain(updatedEntity);
  }

  async remove(id: StrigaCard['id']): Promise<void> {
    await this.strigaCardRepository.delete(id);
  }
}
