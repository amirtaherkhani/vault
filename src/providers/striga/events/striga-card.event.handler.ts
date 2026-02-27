import { Injectable } from '@nestjs/common';
import { InternalEventHandlerBase } from '../../../common/internal-events/base/internal-event-handler.base';
import { InternalEventHandler } from '../../../common/internal-events/helper/internal-event-handler.decorator';
import { InternalEvent } from '../../../internal-events/domain/internal-event';
import { StrigaCardEventPayload } from './striga-card.event';
import {
  STRIGA_CARD_ADDED_EVENT,
  STRIGA_CARD_CREATED_EVENT,
} from '../types/striga-event.type';

@Injectable()
@InternalEventHandler(STRIGA_CARD_CREATED_EVENT)
export class StrigaCardCreatedEventHandler extends InternalEventHandlerBase {
  constructor() {
    super(StrigaCardCreatedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = event.payload as Partial<StrigaCardEventPayload>;
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await Promise.resolve(this.onCardCreated(payload, eventId));
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private onCardCreated(
    payload: Partial<StrigaCardEventPayload>,
    traceId: string,
  ): void {
    this.logger.log(
      `[trace=${traceId}] Striga card created and saved source=${String(payload.source ?? 'n/a')} appUserId=${String(payload.appUserId ?? 'n/a')} localStrigaUserId=${String(payload.localStrigaUserId ?? 'n/a')} externalId=${String(payload.externalId ?? 'n/a')} localCardId=${String(payload.localCardId ?? 'n/a')} cardId=${String(payload.cardId ?? 'n/a')} walletId=${String(payload.parentWalletId ?? 'n/a')} linkedAccountId=${String(payload.linkedAccountId ?? 'n/a')} currency=${String(payload.linkedAccountCurrency ?? 'n/a')}.`,
    );
  }
}

@Injectable()
@InternalEventHandler(STRIGA_CARD_ADDED_EVENT)
export class StrigaCardAddedEventHandler extends InternalEventHandlerBase {
  constructor() {
    super(StrigaCardAddedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = event.payload as Partial<StrigaCardEventPayload>;
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await Promise.resolve(this.onCardAdded(payload, eventId));
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private onCardAdded(
    payload: Partial<StrigaCardEventPayload>,
    traceId: string,
  ): void {
    this.logger.log(
      `[trace=${traceId}] Striga card recovered from provider and saved source=${String(payload.source ?? 'n/a')} appUserId=${String(payload.appUserId ?? 'n/a')} localStrigaUserId=${String(payload.localStrigaUserId ?? 'n/a')} externalId=${String(payload.externalId ?? 'n/a')} localCardId=${String(payload.localCardId ?? 'n/a')} cardId=${String(payload.cardId ?? 'n/a')} walletId=${String(payload.parentWalletId ?? 'n/a')} linkedAccountId=${String(payload.linkedAccountId ?? 'n/a')} currency=${String(payload.linkedAccountCurrency ?? 'n/a')}.`,
    );
  }
}
