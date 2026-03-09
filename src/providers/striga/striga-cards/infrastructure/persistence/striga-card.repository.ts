import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options.type';
import { StrigaCard } from '../../domain/striga-card';
import { StrigaUser } from '../../../striga-users/domain/striga-user';

export abstract class StrigaCardRepository {
  abstract create(
    data: Omit<StrigaCard, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StrigaCard>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StrigaCard[]>;

  abstract findById(id: StrigaCard['id']): Promise<NullableType<StrigaCard>>;

  abstract findByExternalId(
    externalId: NonNullable<StrigaCard['externalId']>,
  ): Promise<NullableType<StrigaCard>>;

  abstract findByIds(ids: StrigaCard['id'][]): Promise<StrigaCard[]>;

  abstract findByStrigaUserIdOrExternalId(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<StrigaCard[]>;

  abstract findByStrigaUserWithFilters(
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
    filters?: {
      status?: StrigaCard['status'];
      linkedAccountCurrency?: StrigaCard['linkedAccountCurrency'];
      parentWalletId?: StrigaCard['parentWalletId'];
    },
  ): Promise<StrigaCard[]>;

  abstract findByParentWalletId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
  ): Promise<StrigaCard[]>;

  abstract findByLinkedAccountId(
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ): Promise<NullableType<StrigaCard>>;

  abstract findByParentWalletIdAndLinkedAccountId(
    parentWalletId: NonNullable<StrigaCard['parentWalletId']>,
    linkedAccountId: NonNullable<StrigaCard['linkedAccountId']>,
  ): Promise<NullableType<StrigaCard>>;

  abstract findByStrigaUserIdOrExternalIdAndLinkedAccountCurrency(
    linkedAccountCurrency: NonNullable<StrigaCard['linkedAccountCurrency']>,
    userId?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ): Promise<NullableType<StrigaCard>>;

  abstract update(
    id: StrigaCard['id'],
    payload: DeepPartial<StrigaCard>,
  ): Promise<StrigaCard | null>;

  abstract remove(id: StrigaCard['id']): Promise<void>;
}
