import { StrigaUsersModule } from '../striga-users/striga-users.module';
import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { StrigaCardsService } from './striga-cards.service';
import { StrigaCardsController } from './striga-cards.controller';
import { RelationalStrigaCardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    StrigaUsersModule,

    // do not remove this comment
    RelationalStrigaCardPersistenceModule,
  ],
  controllers: [StrigaCardsController],
  providers: [StrigaCardsService],
  exports: [StrigaCardsService, RelationalStrigaCardPersistenceModule],
})
export class StrigaCardsModule {}
