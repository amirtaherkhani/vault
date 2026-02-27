import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options.type';
import { StrigaCard } from '../../domain/striga-card';

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

  abstract findByIds(ids: StrigaCard['id'][]): Promise<StrigaCard[]>;

  abstract update(
    id: StrigaCard['id'],
    payload: DeepPartial<StrigaCard>,
  ): Promise<StrigaCard | null>;

  abstract remove(id: StrigaCard['id']): Promise<void>;
}
