import { Injectable } from '@nestjs/common';
import { InternalEventHandlerBase } from '../../../common/internal-events/base/internal-event-handler.base';
import { InternalEventHandler } from '../../../common/internal-events/helper/internal-event-handler.decorator';
import { InternalEvent } from '../../../internal-events/domain/internal-event';
import { UserEventDto } from '../../../users/dto/user.dto';
import { GroupPlainToInstance } from '../../../utils/transformers/class.transformer';
import { StrigaKycWebhookEventDto } from '../dto/striga-kyc-webhook.dto';
import {
  VERO_LOGIN_USER_ADDED_EVENT,
  VERO_LOGIN_USER_DELETED_EVENT,
  VERO_LOGIN_USER_LOGGED_IN_EVENT,
} from '../../../users/types/user-event.type';
import { StrigaUserWorkflowService } from '../services/striga-user-workflow.service';
import { STRIGA_WEBHOOK_KYC_EVENT } from '../types/striga-event.type';

@Injectable()
@InternalEventHandler(VERO_LOGIN_USER_LOGGED_IN_EVENT)
export class StrigaUserLoggedInEventHandler extends InternalEventHandlerBase {
  constructor(private readonly workflow: StrigaUserWorkflowService) {
    super(StrigaUserLoggedInEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = new UserEventDto(event.payload as Partial<UserEventDto>);
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.onLoggedIn(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private async onLoggedIn(
    payload: UserEventDto,
    traceId: string,
  ): Promise<void> {
    await this.workflow.processVeroUserEvent(payload, traceId, 'login');
  }
}

@Injectable()
@InternalEventHandler(VERO_LOGIN_USER_ADDED_EVENT)
export class StrigaUserAddedEventHandler extends InternalEventHandlerBase {
  constructor(private readonly workflow: StrigaUserWorkflowService) {
    super(StrigaUserAddedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = new UserEventDto(event.payload as Partial<UserEventDto>);
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.onAdded(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private async onAdded(payload: UserEventDto, traceId: string): Promise<void> {
    await this.workflow.processVeroUserEvent(payload, traceId, 'created');
  }
}

@Injectable()
@InternalEventHandler(VERO_LOGIN_USER_DELETED_EVENT)
export class StrigaUserDeletedEventHandler extends InternalEventHandlerBase {
  constructor(private readonly workflow: StrigaUserWorkflowService) {
    super(StrigaUserDeletedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = new UserEventDto(event.payload as Partial<UserEventDto>);
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.onDeleted(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private async onDeleted(
    payload: UserEventDto,
    traceId: string,
  ): Promise<void> {
    await this.workflow.processUserDeleted(payload, traceId);
  }
}

@Injectable()
@InternalEventHandler(STRIGA_WEBHOOK_KYC_EVENT)
export class StrigaKycWebhookEventHandler extends InternalEventHandlerBase {
  constructor(private readonly workflow: StrigaUserWorkflowService) {
    super(StrigaKycWebhookEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = GroupPlainToInstance(
      StrigaKycWebhookEventDto,
      event.payload as Partial<StrigaKycWebhookEventDto>,
      [],
    );
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.onKycWebhook(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private async onKycWebhook(
    payload: StrigaKycWebhookEventDto,
    traceId: string,
  ): Promise<void> {
    await this.workflow.processKycWebhook(payload, traceId);
  }
}
