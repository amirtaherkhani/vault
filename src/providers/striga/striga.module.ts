import { Module } from '@nestjs/common';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { UsersModule } from '../../users/users.module';
import { ProvidersModule } from '../providers.module';
import {
  StrigaUserDeletedEventHandler,
  StrigaUserLoggedInEventHandler,
  StrigaUserSyncEventHandler,
  StrigaWebhookUserCreatedEventHandler,
} from './events/striga-user.event.handler';
import { StrigaUserWorkflowService } from './services/striga-user-workflow.service';
import { StrigaUsersModule } from './striga-users/striga-users.module';
import { StrigaController } from './striga.controller';
import { StrigaService } from './striga.service';

@Module({
  imports: [ProvidersModule, UsersModule, StrigaUsersModule],
  providers: [
    StrigaUserWorkflowService,
    StrigaService,
    StrigaUserLoggedInEventHandler,
    StrigaUserDeletedEventHandler,
    StrigaUserSyncEventHandler,
    StrigaWebhookUserCreatedEventHandler,
    EnableGuard,
  ],
  controllers: [StrigaController],
  exports: [StrigaService],
})
export class StrigaModule {}
