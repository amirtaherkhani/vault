import { Injectable } from '@nestjs/common';
import { InternalEventHandlerBase } from '../../../common/internal-events/base/internal-event-handler.base';
import { InternalEventHandler } from '../../../common/internal-events/helper/internal-event-handler.decorator';
import { InternalEvent } from '../../../internal-events/domain/internal-event';
import { UserEventDto } from '../../../users/dto/user.dto';
import { GroupPlainToInstance } from '../../../utils/transformers/class.transformer';
import { StrigaKycWebhookEventDto } from '../dto/striga.webhook.dto';
import { StrigaUserKycTierUpdatedEventPayload } from './striga-user.event';
import {
  VERO_LOGIN_USER_ADDED_EVENT,
  VERO_LOGIN_USER_DELETED_EVENT,
  VERO_LOGIN_USER_LOGGED_IN_EVENT,
} from '../../../users/types/user-event.type';
import { UsersService } from '../../../users/users.service';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaCardWorkflowService } from '../services/striga-card-workflow.service';
import { StrigaUserWorkflowService } from '../services/striga-user-workflow.service';
import {
  STRIGA_USER_KYC_TIER_UPDATED_EVENT,
  STRIGA_WEBHOOK_KYC_EVENT,
} from '../types/striga-event.type';

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
    const externalId = String(payload.userId ?? '').trim();
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] Striga KYC webhook payload missing userId; skipping handler flow.`,
      );
      return;
    }

    this.logger.debug(
      `[trace=${traceId}] Handling Striga KYC webhook with externalId=${externalId}.`,
    );

    await this.workflow.processKycWebhook(payload, traceId);
  }
}

@Injectable()
@InternalEventHandler(STRIGA_USER_KYC_TIER_UPDATED_EVENT)
export class StrigaUserKycTierUpdatedEventHandler extends InternalEventHandlerBase {
  constructor(
    private readonly usersService: UsersService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly strigaCardWorkflowService: StrigaCardWorkflowService,
  ) {
    super(StrigaUserKycTierUpdatedEventHandler.name);
  }

  async handle(event: InternalEvent): Promise<void> {
    const payload =
      event.payload as Partial<StrigaUserKycTierUpdatedEventPayload>;
    const eventId = this.id(event);

    this.received(event, eventId, payload, true);

    try {
      await this.onKycTierUpdated(payload, eventId);
      this.processed(event, eventId);
    } catch (error) {
      this.failed(event, eventId, error);
    }
  }

  private async onKycTierUpdated(
    payload: Partial<StrigaUserKycTierUpdatedEventPayload>,
    traceId: string,
  ): Promise<void> {
    const tier = String(payload.tier ?? '')
      .trim()
      .toLowerCase();
    if (!tier) {
      this.logger.warn(
        `[trace=${traceId}] Missing tier in Striga KYC tier-updated payload; skipping handler.`,
      );
      return;
    }

    const previousStatus = String(payload.previousStatus ?? '')
      .trim()
      .toUpperCase();
    const currentStatus = String(payload.currentStatus ?? '')
      .trim()
      .toUpperCase();
    const isTier1ApprovedTransition =
      tier === 'tier1' &&
      currentStatus === 'APPROVED' &&
      previousStatus !== 'APPROVED';

    this.logger.debug(
      `[trace=${traceId}] Handling internal event kyc:tier:update source=${String(payload.source ?? 'n/a')} trigger=${String(payload.trigger ?? 'n/a')} localId=${String(payload.localId ?? 'n/a')} externalId=${String(payload.externalId ?? payload.userId ?? 'n/a')} tier=${tier} previous=${previousStatus || 'null'} current=${currentStatus || 'null'}.`,
    );

    if (!isTier1ApprovedTransition) {
      this.logger.debug(
        `[trace=${traceId}] kyc:tier:update does not match card-trigger condition (tier1 transition to APPROVED); card workflow skipped.`,
      );
      return;
    }

    const externalId = String(
      payload.externalId ?? payload.userId ?? '',
    ).trim();
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] Missing Striga externalId in kyc:tier:update payload; card workflow skipped.`,
      );
      return;
    }

    const strigaUser =
      await this.strigaUsersService.findByExternalId(externalId);
    if (!strigaUser) {
      this.logger.warn(
        `[trace=${traceId}] Striga user not found for externalId=${externalId}; card workflow skipped.`,
      );
      return;
    }

    const email = String(strigaUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Striga user email is empty for externalId=${externalId}; card workflow skipped.`,
      );
      return;
    }

    const appUser = await this.usersService.findByEmail(email);
    const appUserId = Number(appUser?.id);
    if (!appUser || Number.isNaN(appUserId)) {
      this.logger.warn(
        `[trace=${traceId}] App user not found by email=${email}; card workflow skipped for externalId=${externalId}.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] kyc:tier:update matched tier1->APPROVED; starting card workflow externalId=${externalId} appUserId=${String(appUserId)}.`,
    );
    await this.strigaCardWorkflowService.processUserCards({
      strigaUser,
      appUserId,
      traceId,
      source: 'kyc:tier:update',
    });
    this.logger.log(
      `[trace=${traceId}] Card workflow completed from kyc:tier:update externalId=${externalId} appUserId=${String(appUserId)}.`,
    );
  }
}
