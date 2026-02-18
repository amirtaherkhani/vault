import { Injectable } from '@nestjs/common';
import { InternalEventHandlerBase } from '../../../common/internal-events/base/internal-event-handler.base';
import { InternalEventHandler } from '../../../common/internal-events/helper/internal-event-handler.decorator';
import { InternalEvent } from '../../../internal-events/domain/internal-event';
import { UserEventDto } from '../../../users/dto/user.dto';
import {
  VERO_LOGIN_USER_ADDED_EVENT,
  VERO_LOGIN_USER_DELETED_EVENT,
} from '../../../users/types/user-event.type';
import { StrigaUserWorkflowService } from '../services/striga-user-workflow.service';
import { STRIGA_WEBHOOK_USER_CREATED_EVENT } from '../types/striga-event.type';

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
      await this.workflow.onUserAdded(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
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
      await this.workflow.onUserDeleted(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }
}

@Injectable()
@InternalEventHandler(STRIGA_WEBHOOK_USER_CREATED_EVENT)
export class StrigaWebhookUserCreatedEventHandler extends InternalEventHandlerBase {
  constructor(private readonly workflow: StrigaUserWorkflowService) {
    super(StrigaWebhookUserCreatedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.workflow.onWebhookUserCreated(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }
}
