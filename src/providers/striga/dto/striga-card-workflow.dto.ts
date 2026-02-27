import { StrigaWalletAccountSummary } from '../helpers/striga-wallet.helper';
import { StrigaCardType } from '../striga-cards/domain/striga-card';
import { StrigaUser } from '../striga-users/domain/striga-user';
import { StrigaCreateCardResponseDto } from './striga-base.response.dto';

export class StrigaProcessUserCardsWorkflowDto {
  strigaUser!: StrigaUser;
  appUserId!: number;
  traceId!: string;
  source!: string;
}

export class StrigaSyncCardForWalletAccountWorkflowDto {
  strigaUser!: StrigaUser;
  appUserId!: number;
  externalId!: string;
  walletId!: string;
  walletAccount!: StrigaWalletAccountSummary;
  providerWalletCards!: StrigaCreateCardResponseDto[];
  defaultPassword!: string;
  traceId!: string;
  source!: string;
}

export class StrigaCardSyncResultDto {
  operation!: 'updated' | 'recovered' | 'created' | 'skipped';
  type!: StrigaCardType | null;
}

export class StrigaCardSyncCountersDto {
  updated = 0;
  recovered = 0;
  created = 0;
  skipped = 0;
}
