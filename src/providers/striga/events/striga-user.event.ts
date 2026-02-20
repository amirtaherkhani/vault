import { InternalEventBase } from '../../../common/internal-events/base/internal-event.abstract';
import { UserEventDto } from '../../../users/dto/user.dto';
import {
  STRIGA_USER_SYNC_EVENT,
  STRIGA_WEBHOOK_USER_CREATED_EVENT,
} from '../types/striga-event.type';

export class StrigaUserInternalEvent extends InternalEventBase<UserEventDto> {
  private constructor(eventType: string, payload: UserEventDto) {
    super(eventType, payload);
  }

  static sync(payload: UserEventDto): StrigaUserInternalEvent {
    return new StrigaUserInternalEvent(STRIGA_USER_SYNC_EVENT, payload);
  }

  static create(payload: UserEventDto): StrigaUserInternalEvent {
    return new StrigaUserInternalEvent(
      STRIGA_WEBHOOK_USER_CREATED_EVENT,
      payload,
    );
  }
}
