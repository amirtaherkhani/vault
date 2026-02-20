import { InternalEventBase } from '../../../common/internal-events/base/internal-event.abstract';
import {
  STRIGA_USER_CREATED_EVENT,
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

export class StrigaUserEvent extends InternalEventBase<StrigaUserEventPayload> {
  private constructor(eventType: string, payload: StrigaUserEventPayload) {
    super(eventType, payload);
  }

  static userCreated(payload: StrigaUserEventPayload): StrigaUserEvent {
    return new StrigaUserEvent(STRIGA_USER_CREATED_EVENT, payload);
  }

  static userSynced(payload: StrigaUserEventPayload): StrigaUserEvent {
    return new StrigaUserEvent(STRIGA_USER_SYNCED_EVENT, payload);
  }
}
