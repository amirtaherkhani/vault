import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import { User } from '../../domain/user';

import { FilterUserDto, SortUserDto } from '../../dto/query-user.dto';

export abstract class UserRepository {
  abstract create(
    data: Omit<User, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<User>;

  abstract createMany(
    data: Omit<User, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>[],
  ): Promise<User[]>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]>;

  abstract findById(id: User['id']): Promise<NullableType<User>>;
  abstract findByIds(ids: User['id'][]): Promise<User[]>;
  abstract findByEmail(email: User['email']): Promise<NullableType<User>>;
  abstract findBySocialId(
    socialId: User['socialId'],
  ): Promise<NullableType<User>>;
  abstract findBySocialIds(socialIds: User['socialId'][]): Promise<User[]>;
  abstract findBySocialIdAndProvider({
    socialId,
    provider,
  }: {
    socialId: User['socialId'];
    provider: User['provider'];
  }): Promise<NullableType<User>>;
  abstract findByProviderAndSocialIds({
    socialIds,
    provider,
  }: {
    socialIds: User['socialId'][];
    provider: User['provider'];
  }): Promise<User[]>;
  abstract findByEmails(emails: User['email'][]): Promise<User[]>;

  abstract update(
    id: User['id'],
    payload: DeepPartial<User>,
  ): Promise<NullableType<User>>;

  abstract updateMany(
    payloads: { id: User['id']; payload: DeepPartial<User> }[],
  ): Promise<User[]>;

  abstract remove(id: User['id']): Promise<void>;
}
