import { StrigaUsersModule } from '../striga-users/striga-users.module';
import { AccountsModule } from '../../../accounts/accounts.module';
import { UsersModule } from '../../../users/users.module';
import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { StrigaCardsService } from './striga-cards.service';
import { StrigaCardsController } from './striga-cards.controller';
import { RelationalStrigaCardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { StrigaService } from '../striga.service';
import { ProvidersModule } from '../../providers.module';

@Module({
  imports: [
    StrigaUsersModule,
    AccountsModule,
    UsersModule,
    ProvidersModule,

    // do not remove this comment
    RelationalStrigaCardPersistenceModule,
  ],
  controllers: [StrigaCardsController],
  providers: [StrigaCardsService, StrigaService],
  exports: [StrigaCardsService, RelationalStrigaCardPersistenceModule],
})
export class StrigaCardsModule {}
