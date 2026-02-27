import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StrigaCardEntity } from '../entities/striga-card.entity';
import { NullableType } from '../../../../../../../utils/types/nullable.type';
import { StrigaCard } from '../../../../domain/striga-card';
import { StrigaCardRepository } from '../../striga-card.repository';
import { StrigaCardMapper } from '../mappers/striga-card.mapper';
import { IPaginationOptions } from '../../../../../../../utils/types/pagination-options.type';

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

  async findByIds(ids: StrigaCard['id'][]): Promise<StrigaCard[]> {
    const entities = await this.strigaCardRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => StrigaCardMapper.toDomain(entity));
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
