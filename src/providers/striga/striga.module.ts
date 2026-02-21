import { Module } from '@nestjs/common';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { AccountsModule } from '../../accounts/accounts.module';
import { UsersModule } from '../../users/users.module';
import { ProvidersModule } from '../providers.module';
import {
  StrigaUserAddedEventHandler,
  StrigaUserDeletedEventHandler,
  StrigaUserLoggedInEventHandler,
  StrigaKycWebhookEventHandler,
} from './events/striga-user.event.handler';
import { StrigaKycApprovedGuard } from './guards/striga-kyc-approved.guard';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { StrigaUserWorkflowService } from './services/striga-user-workflow.service';
import { StrigaUsersModule } from './striga-users/striga-users.module';
import { StrigaController } from './striga.controller';
import { StrigaService } from './striga.service';

@Module({
  imports: [ProvidersModule, UsersModule, AccountsModule, StrigaUsersModule],
  providers: [
    StrigaUserWorkflowService,
    StrigaService,
    StrigaUserLoggedInEventHandler,
    StrigaUserAddedEventHandler,
    StrigaUserDeletedEventHandler,
    StrigaKycWebhookEventHandler,
    StrigaUserExistsGuard,
    StrigaKycApprovedGuard,
    EnableGuard,
  ],
  controllers: [StrigaController],
  exports: [StrigaService],
})
export class StrigaModule {}
