import { Injectable } from '@nestjs/common';
import { InternalEventHandlerBase } from '../../../common/internal-events/base/internal-event-handler.base';
import { InternalEventHandler } from '../../../common/internal-events/helper/internal-event-handler.decorator';
import { InternalEvent } from '../../../internal-events/domain/internal-event';
import { UserEventDto } from '../../../users/dto/user.dto';
import { UsersService } from '../../../users/users.service';
import { GroupPlainToInstance } from '../../../utils/transformers/class.transformer';
import { StrigaKycWebhookEventDto } from '../dto/striga.webhook.dto';
import { StrigaUserKycTierUpdatedEventPayload } from './striga-user.event';
import {
  VERO_LOGIN_USER_ADDED_EVENT,
  VERO_LOGIN_USER_DELETED_EVENT,
  VERO_LOGIN_USER_LOGGED_IN_EVENT,
} from '../../../users/types/user-event.type';
import { StrigaUserWorkflowService } from '../services/striga-user-workflow.service';
import { StrigaCardWorkflowService } from '../services/striga-card-workflow.service';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaUser } from '../striga-users/domain/striga-user';
import {
  STRIGA_USER_KYC_TIER_UPDATED_EVENT,
  STRIGA_WEBHOOK_KYC_EVENT,
} from '../types/striga-event.type';

@Injectable()
@InternalEventHandler(VERO_LOGIN_USER_LOGGED_IN_EVENT)
export class StrigaUserLoggedInEventHandler extends InternalEventHandlerBase {
  constructor(
    private readonly workflow: StrigaUserWorkflowService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly strigaCardWorkflowService: StrigaCardWorkflowService,
  ) {
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
    await this.runCardWorkflowForUserEvent(payload, traceId, 'vero-login');
  }

  private async runCardWorkflowForUserEvent(
    payload: UserEventDto,
    traceId: string,
    source: string,
  ): Promise<void> {
    const appUserId = normalizeAppUserId(payload.userId);
    if (!appUserId) {
      this.logger.warn(
        `[trace=${traceId}] Card flow skipped because app user id is missing in event payload. Source=${source}.`,
      );
      return;
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser) {
      this.logger.debug(
        `[trace=${traceId}] Card flow skipped because local Striga user was not found for appUserId=${String(appUserId)}. Source=${source}.`,
      );
      return;
    }

    if (!isTier1Approved(strigaUser)) {
      this.logger.debug(
        `[trace=${traceId}] Card flow skipped because local tier1 is ${String(strigaUser.kyc?.tier1?.status ?? 'null')} (required: APPROVED). Source=${source}.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] Running isolated card flow appUserId=${String(appUserId)} strigaExternalId=${String(strigaUser.externalId ?? 'n/a')} source=${source}.`,
    );
    await this.strigaCardWorkflowService.processUserCards({
      strigaUser,
      appUserId,
      traceId,
      source,
    });
    this.logger.log(
      `[trace=${traceId}] Card flow completed appUserId=${String(appUserId)} strigaExternalId=${String(strigaUser.externalId ?? 'n/a')} source=${source}.`,
    );
  }
}

@Injectable()
@InternalEventHandler(VERO_LOGIN_USER_ADDED_EVENT)
export class StrigaUserAddedEventHandler extends InternalEventHandlerBase {
  constructor(
    private readonly workflow: StrigaUserWorkflowService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly strigaCardWorkflowService: StrigaCardWorkflowService,
  ) {
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
    await this.runCardWorkflowForUserEvent(payload, traceId, 'vero-created');
  }

  private async runCardWorkflowForUserEvent(
    payload: UserEventDto,
    traceId: string,
    source: string,
  ): Promise<void> {
    const appUserId = normalizeAppUserId(payload.userId);
    if (!appUserId) {
      this.logger.warn(
        `[trace=${traceId}] Card flow skipped because app user id is missing in event payload. Source=${source}.`,
      );
      return;
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser) {
      this.logger.debug(
        `[trace=${traceId}] Card flow skipped because local Striga user was not found for appUserId=${String(appUserId)}. Source=${source}.`,
      );
      return;
    }

    if (!isTier1Approved(strigaUser)) {
      this.logger.debug(
        `[trace=${traceId}] Card flow skipped because local tier1 is ${String(strigaUser.kyc?.tier1?.status ?? 'null')} (required: APPROVED). Source=${source}.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] Running isolated card flow appUserId=${String(appUserId)} strigaExternalId=${String(strigaUser.externalId ?? 'n/a')} source=${source}.`,
    );
    await this.strigaCardWorkflowService.processUserCards({
      strigaUser,
      appUserId,
      traceId,
      source,
    });
    this.logger.log(
      `[trace=${traceId}] Card flow completed appUserId=${String(appUserId)} strigaExternalId=${String(strigaUser.externalId ?? 'n/a')} source=${source}.`,
    );
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
    private readonly strigaUsersService: StrigaUsersService,
    private readonly usersService: UsersService,
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

    this.logger.debug(
      `[trace=${traceId}] Handling internal event kyc:tier:update source=${String(payload.source ?? 'n/a')} trigger=${String(payload.trigger ?? 'n/a')} localId=${String(payload.localId ?? 'n/a')} externalId=${String(payload.externalId ?? payload.userId ?? 'n/a')} tier=${tier} previous=${previousStatus || 'null'} current=${currentStatus || 'null'}.`,
    );

    if (tier !== 'tier1' || currentStatus !== 'APPROVED') {
      this.logger.debug(
        `[trace=${traceId}] KYC tier update card flow skipped tier=${tier} current=${currentStatus || 'null'} (required: tier1 + APPROVED).`,
      );
      return;
    }

    const externalId = String(
      payload.externalId ?? payload.userId ?? '',
    ).trim();
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] KYC tier update card flow skipped because externalId is missing.`,
      );
      return;
    }

    const strigaUser =
      await this.strigaUsersService.findByExternalId(externalId);
    if (!strigaUser) {
      this.logger.warn(
        `[trace=${traceId}] KYC tier update card flow skipped because local Striga user was not found for externalId=${externalId}.`,
      );
      return;
    }

    if (!isTier1Approved(strigaUser)) {
      this.logger.debug(
        `[trace=${traceId}] KYC tier update card flow skipped because local tier1 is ${String(strigaUser.kyc?.tier1?.status ?? 'null')} (required: APPROVED).`,
      );
      return;
    }

    const normalizedEmail = String(strigaUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!normalizedEmail) {
      this.logger.warn(
        `[trace=${traceId}] KYC tier update card flow skipped because local Striga user email is empty for externalId=${externalId}.`,
      );
      return;
    }

    const appUser = await this.usersService.findByEmail(normalizedEmail);
    const appUserId = normalizeAppUserId(appUser?.id);
    if (!appUserId) {
      this.logger.warn(
        `[trace=${traceId}] KYC tier update card flow skipped because app user was not found by email=${normalizedEmail}.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] KYC tier update running isolated card flow appUserId=${String(appUserId)} strigaExternalId=${externalId}.`,
    );
    await this.strigaCardWorkflowService.processUserCards({
      strigaUser,
      appUserId,
      traceId,
      source: 'kyc:tier:update',
    });
    this.logger.log(
      `[trace=${traceId}] KYC tier update isolated card flow completed appUserId=${String(appUserId)} strigaExternalId=${externalId}.`,
    );
  }
}

function normalizeAppUserId(value: unknown): number | null {
  const resolved = Number(value);
  if (Number.isNaN(resolved) || resolved <= 0) {
    return null;
  }

  return resolved;
}

function isTier1Approved(strigaUser: StrigaUser | null): boolean {
  const status = String(strigaUser?.kyc?.tier1?.status ?? '')
    .trim()
    .toUpperCase();
  return status === 'APPROVED';
}
