import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StrigaUserEntity } from '../entities/striga-user.entity';
import { NullableType } from '../../../../../../../utils/types/nullable.type';
import { StrigaUser } from '../../../../domain/striga-user';
import { StrigaUserRepository } from '../../striga-user.repository';
import { StrigaUserMapper } from '../mappers/striga-user.mapper';
import { IPaginationOptions } from '../../../../../../../utils/types/pagination-options.type';

@Injectable()
export class StrigaUserRelationalRepository implements StrigaUserRepository {
  constructor(
    @InjectRepository(StrigaUserEntity)
    private readonly strigaUserRepository: Repository<StrigaUserEntity>,
  ) {}

  async create(data: StrigaUser): Promise<StrigaUser> {
    const persistenceModel = StrigaUserMapper.toPersistence(data);
    const newEntity = await this.strigaUserRepository.save(
      this.strigaUserRepository.create(persistenceModel),
    );
    return StrigaUserMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StrigaUser[]> {
    const entities = await this.strigaUserRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => StrigaUserMapper.toDomain(entity));
  }

  async findById(id: StrigaUser['id']): Promise<NullableType<StrigaUser>> {
    const entity = await this.strigaUserRepository.findOne({
      where: { id },
    });

    return entity ? StrigaUserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: StrigaUser['id'][]): Promise<StrigaUser[]> {
    const entities = await this.strigaUserRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => StrigaUserMapper.toDomain(entity));
  }

  async findByIdOrExternalId(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaUser>> {
    if (id) {
      return this.findById(id);
    }

    if (externalId) {
      return this.findUserByExternalId(externalId);
    }

    return null;
  }

  async findKycByIdOrExternalId(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<StrigaUser['kyc'] | null> {
    if (!id && !externalId) {
      return null;
    }

    const qb = this.strigaUserRepository
      .createQueryBuilder('strigaUser')
      .select('strigaUser.kyc', 'kyc')
      .limit(1);

    if (id) {
      qb.where('strigaUser.id = :id', { id });
    } else {
      qb.where('strigaUser.externalId = :externalId', { externalId });
    }

    const raw = await qb.getRawOne<{ kyc?: StrigaUser['kyc'] | null }>();
    return raw?.kyc ?? null;
  }

  async findUserByExternalId(
    externalId: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaUser>> {
    const entity = await this.strigaUserRepository.findOne({
      where: { externalId },
    });

    return entity ? StrigaUserMapper.toDomain(entity) : null;
  }

  async findUserByEmail(
    email: StrigaUser['email'],
  ): Promise<NullableType<StrigaUser>> {
    const entity = await this.strigaUserRepository.findOne({
      where: { email },
    });

    return entity ? StrigaUserMapper.toDomain(entity) : null;
  }

  async filter(
    externalId?: StrigaUser['externalId'],
    email?: StrigaUser['email'],
    firstName?: StrigaUser['firstName'],
    lastName?: StrigaUser['lastName'],
  ): Promise<StrigaUser[]> {
    const whereClause: any = {};

    if (typeof externalId !== 'undefined') {
      whereClause.externalId = externalId;
    }
    if (typeof email !== 'undefined') {
      whereClause.email = email;
    }
    if (typeof firstName !== 'undefined') {
      whereClause.firstName = firstName;
    }
    if (typeof lastName !== 'undefined') {
      whereClause.lastName = lastName;
    }

    const entities = await this.strigaUserRepository.find({
      where: whereClause,
    });

    return entities.map((entity) => StrigaUserMapper.toDomain(entity));
  }

  async update(
    id: StrigaUser['id'],
    payload: Partial<StrigaUser>,
  ): Promise<StrigaUser> {
    const entity = await this.strigaUserRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.strigaUserRepository.save(
      this.strigaUserRepository.create(
        StrigaUserMapper.toPersistence({
          ...StrigaUserMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return StrigaUserMapper.toDomain(updatedEntity);
  }

  async updateByIdOrExternalId(
    id: StrigaUser['id'] | undefined,
    externalId: StrigaUser['externalId'] | undefined,
    payload: Partial<StrigaUser>,
  ): Promise<StrigaUser | null> {
    const entity = await this.findByIdOrExternalId(id, externalId);

    if (!entity) {
      return null;
    }

    return this.update(entity.id, payload);
  }

  async remove(id: StrigaUser['id']): Promise<void> {
    await this.strigaUserRepository.delete(id);
  }
}
