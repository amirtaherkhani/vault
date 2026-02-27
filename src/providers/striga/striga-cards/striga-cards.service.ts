import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateStrigaCardDto } from './dto/create-striga-card.dto';
import { UpdateStrigaCardDto } from './dto/update-striga-card.dto';
import { StrigaCardRepository } from './infrastructure/persistence/striga-card.repository';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import { StrigaCard } from './domain/striga-card';

@Injectable()
export class StrigaCardsService {
  constructor(
    // Dependencies here
    private readonly strigaCardRepository: StrigaCardRepository,
  ) {}

  async create(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createStrigaCardDto: CreateStrigaCardDto,
  ) {
    // Do not remove comment below.
    // <creating-property />

    return this.strigaCardRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.strigaCardRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: StrigaCard['id']) {
    return this.strigaCardRepository.findById(id);
  }

  findByIds(ids: StrigaCard['id'][]) {
    return this.strigaCardRepository.findByIds(ids);
  }

  async update(
    id: StrigaCard['id'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateStrigaCardDto: UpdateStrigaCardDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.strigaCardRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
    });
  }

  remove(id: StrigaCard['id']) {
    return this.strigaCardRepository.remove(id);
  }
}
