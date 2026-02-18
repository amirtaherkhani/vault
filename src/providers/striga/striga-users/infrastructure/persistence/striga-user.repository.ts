import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options.type';
import { StrigaUser } from '../../domain/striga-user';

export abstract class StrigaUserRepository {
  abstract create(
    data: Omit<StrigaUser, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StrigaUser>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StrigaUser[]>;

  abstract findById(id: StrigaUser['id']): Promise<NullableType<StrigaUser>>;

  abstract findByIds(ids: StrigaUser['id'][]): Promise<StrigaUser[]>;

  abstract findByIdOrExternalId(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaUser>>;

  abstract findUserByExternalId(
    externalId: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaUser>>;

  abstract findUserByEmail(
    email: StrigaUser['email'],
  ): Promise<NullableType<StrigaUser>>;

  abstract filter(
    externalId?: StrigaUser['externalId'],
    email?: StrigaUser['email'],
    firstName?: StrigaUser['firstName'],
    lastName?: StrigaUser['lastName'],
  ): Promise<StrigaUser[]>;

  abstract update(
    id: StrigaUser['id'],
    payload: DeepPartial<StrigaUser>,
  ): Promise<StrigaUser | null>;

  abstract updateByIdOrExternalId(
    id: StrigaUser['id'] | undefined,
    externalId: StrigaUser['externalId'] | undefined,
    payload: DeepPartial<StrigaUser>,
  ): Promise<StrigaUser | null>;

  abstract remove(id: StrigaUser['id']): Promise<void>;
}
