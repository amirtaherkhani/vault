import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { EnableGuard } from '../../../common/guards/service-enabled.guard';
import { UsersModule } from '../../../users/users.module';
import { StrigaUsersService } from './striga-users.service';
import { RelationalStrigaUserPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    UsersModule,
    RelationalStrigaUserPersistenceModule,
  ],
  providers: [StrigaUsersService, EnableGuard],
  exports: [StrigaUsersService, RelationalStrigaUserPersistenceModule],
})
export class StrigaUsersModule {}
