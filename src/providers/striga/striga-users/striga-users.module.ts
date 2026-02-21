import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { EnableGuard } from '../../../common/guards/service-enabled.guard';
import { UsersModule } from '../../../users/users.module';
import { StrigaUsersService } from './striga-users.service';
import { StrigaUsersController } from './striga-users.controller';
import { RelationalStrigaUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    UsersModule,
    RelationalStrigaUserPersistenceModule,
  ],
  controllers: [StrigaUsersController],
  providers: [StrigaUsersService, EnableGuard],
  exports: [StrigaUsersService, RelationalStrigaUserPersistenceModule],
})
export class StrigaUsersModule {}
