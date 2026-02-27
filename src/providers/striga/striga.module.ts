import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { AccountsModule } from '../../accounts/accounts.module';
import { UsersModule } from '../../users/users.module';
import { ProvidersModule } from '../providers.module';
import {
  StrigaUserAddedEventHandler,
  StrigaUserDeletedEventHandler,
  StrigaUserLoggedInEventHandler,
  StrigaKycWebhookEventHandler,
  StrigaUserKycTierUpdatedEventHandler,
} from './events/striga-user.event.handler';
import { StrigaKycApprovedGuard } from './guards/striga-kyc-approved.guard';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { StrigaCardService } from './services/striga-card.service';
import { StrigaCardWorkflowService } from './services/striga-card-workflow.service';
import { StrigaTransactionService } from './services/striga-transaction.service';
import { StrigaUserService } from './services/striga-kyc.service';
import { StrigaUserWorkflowService } from './services/striga-user-workflow.service';
import { StrigaWalletService } from './services/striga-wallet.service';
import { StrigaCardsModule } from './striga-cards/striga-cards.module';
import { StrigaUsersController } from './striga-users/striga-users.controller';
import { StrigaUsersModule } from './striga-users/striga-users.module';
import { StrigaController } from './striga.controller';
import { StrigaService } from './striga.service';

@Module({
  imports: [
    ProvidersModule,
    UsersModule,
    AccountsModule,
    StrigaUsersModule,
    StrigaCardsModule,
    RouterModule.register([
      {
        path: 'striga',
        module: StrigaModule,
      },
    ]),
  ],
  providers: [
    StrigaUserWorkflowService,
    StrigaCardWorkflowService,
    StrigaService,
    StrigaUserService,
    StrigaWalletService,
    StrigaCardService,
    StrigaTransactionService,
    StrigaUserLoggedInEventHandler,
    StrigaUserAddedEventHandler,
    StrigaUserDeletedEventHandler,
    StrigaKycWebhookEventHandler,
    StrigaUserKycTierUpdatedEventHandler,
    StrigaUserExistsGuard,
    StrigaKycApprovedGuard,
    EnableGuard,
  ],
  controllers: [StrigaController, StrigaUsersController],
  exports: [
    StrigaService,
    StrigaUserService,
    StrigaWalletService,
    StrigaCardService,
    StrigaTransactionService,
  ],
})
export class StrigaModule {}
