import { InternalEventBase } from '../../../common/internal-events/base/internal-event.abstract';
import {
  STRIGA_CARD_ADDED_EVENT,
  STRIGA_CARD_CREATED_EVENT,
} from '../types/striga-event.type';

export type StrigaCardEventPayload = {
  source: string;
  appUserId: number;
  localStrigaUserId: string | null;
  externalId: string | null;
  localCardId: string | null;
  cardId: string | null;
  parentWalletId: string | null;
  linkedAccountId: string | null;
  linkedAccountCurrency: string | null;
  type: string | null;
};

export class StrigaCardEvent extends InternalEventBase<StrigaCardEventPayload> {
  private constructor(eventType: string, payload: StrigaCardEventPayload) {
    super(eventType, payload);
  }

  static cardCreated(payload: StrigaCardEventPayload): StrigaCardEvent {
    return new StrigaCardEvent(STRIGA_CARD_CREATED_EVENT, payload);
  }

  static cardAdded(payload: StrigaCardEventPayload): StrigaCardEvent {
    return new StrigaCardEvent(STRIGA_CARD_ADDED_EVENT, payload);
  }
}
