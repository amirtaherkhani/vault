import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FindOptionsWhere, Repository, In } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from '../../../../dto/query-user.dto';
import { User } from '../../../../domain/user';
import { UserRepository } from '../../user.repository';
import { UserMapper } from '../mappers/user.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options.type';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: User): Promise<User> {
    const persistenceModel = UserMapper.toPersistence(data);
    const newEntity = await this.usersRepository.save(
      this.usersRepository.create(persistenceModel),
    );
    return UserMapper.toDomain(newEntity);
  }

  async createMany(data: User[]): Promise<User[]> {
    if (!data.length) {
      return [];
    }
    const persistenceModels = data.map((item) =>
      this.usersRepository.create(UserMapper.toPersistence(item)),
    );
    const newEntities = await this.usersRepository.save(persistenceModels);
    return newEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    const where: FindOptionsWhere<UserEntity> = {};
    if (filterOptions?.roles?.length) {
      where.role = filterOptions.roles.map((role) => ({
        id: Number(role.id),
      }));
    }

    const entities = await this.usersRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: sortOptions?.reduce(
        (accumulator, sort) => ({
          ...accumulator,
          [sort.orderBy]: sort.order,
        }),
        {},
      ),
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findById(id: User['id']): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findOne({
      where: { id: Number(id) },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByIds(ids: User['id'][]): Promise<User[]> {
    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;

    const entity = await this.usersRepository.findOne({
      where: { email },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findBySocialId(
    socialId: User['socialId'],
  ): Promise<NullableType<User>> {
    if (!socialId) return null;

    const entity = await this.usersRepository.findOne({
      where: { socialId },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findBySocialIds(socialIds: User['socialId'][]): Promise<User[]> {
    if (!socialIds?.length) return [];

    const entities = await this.usersRepository.find({
      where: { socialId: In(socialIds) },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByVeroId(
    veroId: User['veroId'],
  ): Promise<NullableType<User>> {
    if (!veroId) return null;

    const entity = await this.usersRepository.findOne({
      where: { veroId },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>> {
    if (!socialId || !provider) return null;

    const entity = await this.usersRepository.findOne({
      where: { socialId, provider },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByProviderAndSocialIds({
    socialIds,
    provider,
  }: {
    socialIds: User['socialId'][];
    provider: User['provider'];
  }): Promise<User[]> {
    if (!socialIds?.length || !provider) return [];

    const entities = await this.usersRepository.find({
      where: { socialId: In(socialIds), provider },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async findByEmails(emails: User['email'][]): Promise<User[]> {
    if (!emails?.length) return [];

    const entities = await this.usersRepository.find({
      where: { email: In(emails) },
    });

    return entities.map((user) => UserMapper.toDomain(user));
  }

  async update(
    id: User['id'],
    payload: DeepPartial<User>,
  ): Promise<NullableType<User>> {
    const entity = await this.usersRepository.findOne({
      where: { id: Number(id) },
    });

    if (!entity) {
      return null;
    }

    const domainEntity = UserMapper.toDomain(entity);
    const mergedDomain = Object.assign(new User(), domainEntity);
    Object.assign(mergedDomain, this.removeUndefined(payload));

    const updatedEntity = await this.usersRepository.save(
      this.usersRepository.create(UserMapper.toPersistence(mergedDomain)),
    );

    return UserMapper.toDomain(updatedEntity);
  }

  async updateMany(
    payloads: { id: User['id']; payload: DeepPartial<User> }[],
  ): Promise<User[]> {
    if (!payloads.length) {
      return [];
    }

    const ids = payloads.map((item) => Number(item.id));
    const payloadMap = new Map<number, DeepPartial<User>>();
    payloads.forEach((item) => {
      payloadMap.set(Number(item.id), this.removeUndefined(item.payload));
    });

    const entities = await this.usersRepository.find({
      where: { id: In(ids) },
    });

    const mergedEntities = entities.map((entity) => {
      const domainEntity = UserMapper.toDomain(entity);
      const mergedDomain = Object.assign(new User(), domainEntity);
      const payload = payloadMap.get(entity.id);

      if (payload) {
        Object.assign(mergedDomain, payload);
      }

      return this.usersRepository.create(
        UserMapper.toPersistence(mergedDomain),
      );
    });

    const updatedEntities = await this.usersRepository.save(mergedEntities);

    return updatedEntities.map((item) => UserMapper.toDomain(item));
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  private removeUndefined<T extends Record<string, any>>(payload: T): T {
    return Object.entries(payload).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {} as T);
  }
}
