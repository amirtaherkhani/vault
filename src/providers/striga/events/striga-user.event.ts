import { InternalEventBase } from '../../../common/internal-events/base/internal-event.abstract';
import {
  STRIGA_USER_CREATED_EVENT,
  STRIGA_USER_KYC_TIER_UPDATED_EVENT,
  STRIGA_USER_SYNCED_EVENT,
} from '../types/striga-event.type';

export type StrigaUserEventPayload = {
  source: 'workflow' | 'webhook';
  trigger: 'login' | 'created' | 'webhook';
  email: string | null;
  userId: string | null;
  localId: string | null;
  externalId: string | null;
};

export type StrigaUserKycTierUpdatedEventPayload = StrigaUserEventPayload & {
  tier: string;
  previousStatus: string | null;
  currentStatus: string | null;
};

export class StrigaUserEvent extends InternalEventBase<
  StrigaUserEventPayload | StrigaUserKycTierUpdatedEventPayload
> {
  private constructor(
    eventType: string,
    payload: StrigaUserEventPayload | StrigaUserKycTierUpdatedEventPayload,
  ) {
    super(eventType, payload);
  }

  static userCreated(payload: StrigaUserEventPayload): StrigaUserEvent {
    return new StrigaUserEvent(STRIGA_USER_CREATED_EVENT, payload);
  }

  static userSynced(payload: StrigaUserEventPayload): StrigaUserEvent {
    return new StrigaUserEvent(STRIGA_USER_SYNCED_EVENT, payload);
  }

  static userKycTierUpdated(
    payload: StrigaUserKycTierUpdatedEventPayload,
  ): StrigaUserEvent {
    return new StrigaUserEvent(STRIGA_USER_KYC_TIER_UPDATED_EVENT, payload);
  }
}
