import { Module } from '@nestjs/common';
import { StrigaCardRepository } from '../striga-card.repository';
import { StrigaCardRelationalRepository } from './repositories/striga-card.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrigaCardEntity } from './entities/striga-card.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StrigaCardEntity])],
  providers: [
    {
      provide: StrigaCardRepository,
      useClass: StrigaCardRelationalRepository,
    },
  ],
  exports: [StrigaCardRepository],
})
export class RelationalStrigaCardPersistenceModule {}
