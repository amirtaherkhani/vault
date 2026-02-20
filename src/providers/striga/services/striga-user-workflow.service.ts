import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InternalEventsService } from '../../../common/internal-events/internal-events.service';
import { UserEventDto } from '../../../users/dto/user.dto';
import { UsersService } from '../../../users/users.service';
import { StrigaCreateUserRequestDto } from '../dto/striga-request.dto';
import { getStrigaPlaceholderMobile } from '../striga.helper';
import { StrigaUserInternalEvent } from '../events/striga-user.event';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaService } from '../striga.service';
import {
  STRIGA_USER_SYNC_EVENT,
  STRIGA_WEBHOOK_USER_CREATED_EVENT,
} from '../types/striga-event.type';

@Injectable()
export class StrigaUserWorkflowService {
  private readonly logger = new Logger(StrigaUserWorkflowService.name);

  constructor(
    private readonly strigaService: StrigaService,
    private readonly usersService: UsersService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
  ) {}

  async onUserLoggedIn(payload: UserEventDto, traceId: string): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping user-login flow.`,
      );
      return;
    }

    const email = this.normalizeEmail(payload.email);
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Missing email in user-login payload; skipping Striga user workflow.`,
      );
      return;
    }

    const localUser = await this.strigaUsersService.findByEmail(email);
    if (localUser) {
      this.logger.log(
        `[trace=${traceId}] Striga user already exists locally for email=${email}; skipping login workflow.`,
      );
      return;
    }

    const cloudUser = await this.findCloudUserByEmail(email, traceId);
    if (cloudUser) {
      await this.emitStrigaUserEvent(
        StrigaUserInternalEvent.sync(payload),
        traceId,
        `Queued ${STRIGA_USER_SYNC_EVENT} for email=${email} because user exists in Striga cloud but missing locally.`,
      );
      return;
    }

    await this.emitStrigaUserEvent(
      StrigaUserInternalEvent.create(payload),
      traceId,
      `Queued ${STRIGA_WEBHOOK_USER_CREATED_EVENT} for email=${email} because user does not exist in Striga cloud and local DB.`,
    );
  }

  async onUserSync(payload: UserEventDto, traceId: string): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping user-sync flow.`,
      );
      return;
    }

    const email = this.normalizeEmail(payload.email);
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Missing email in user-sync payload; skipping Striga user workflow.`,
      );
      return;
    }

    const localUser = await this.strigaUsersService.findByEmail(email);
    if (localUser) {
      this.logger.log(
        `[trace=${traceId}] Striga user already exists locally for email=${email}; skipping sync.`,
      );
      return;
    }

    const cloudUser = await this.findCloudUserByEmail(email, traceId);
    if (!cloudUser) {
      this.logger.warn(
        `[trace=${traceId}] User sync not found in Striga cloud for email=${email}; queuing create.`,
      );
      await this.emitStrigaUserEvent(
        StrigaUserInternalEvent.create(payload),
        traceId,
        `Queued ${STRIGA_WEBHOOK_USER_CREATED_EVENT} for email=${email} after sync-miss in Striga cloud.`,
      );
      return;
    }

    const synced = await this.strigaUsersService.upsertFromCloudUser(cloudUser);
    this.logger.log(
      `[trace=${traceId}] Synced Striga user from cloud for email=${email}; localSync=${synced ? 'ok' : 'skipped'}.`,
    );
  }

  async onUserCreate(payload: UserEventDto, traceId: string): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping user-create flow.`,
      );
      return;
    }

    const email = this.normalizeEmail(payload.email);
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Missing email in user-create payload; skipping Striga user workflow.`,
      );
      return;
    }

    const localUser = await this.strigaUsersService.findByEmail(email);
    if (localUser) {
      this.logger.log(
        `[trace=${traceId}] Striga user already exists locally for email=${email}; skipping create.`,
      );
      return;
    }

    const cloudUser = await this.findCloudUserByEmail(email, traceId);
    if (cloudUser) {
      await this.emitStrigaUserEvent(
        StrigaUserInternalEvent.sync(payload),
        traceId,
        `Queued ${STRIGA_USER_SYNC_EVENT} for email=${email} because user already exists in Striga cloud.`,
      );
      return;
    }

    const names = await this.resolveNames(payload, traceId);
    if (!names) {
      return;
    }

    const createPayload: StrigaCreateUserRequestDto = {
      firstName: names.firstName || 'Unknown',
      lastName: names.lastName || 'Unknown',
      email,
      mobile: getStrigaPlaceholderMobile(),
    };

    try {
      await this.strigaService.createUser(createPayload);
      this.logger.log(
        `[trace=${traceId}] Striga user created in cloud for email=${email}; waiting for webhook sync.`,
      );
      return;
    } catch (error) {
      if (!this.isDuplicateEmailError(error)) {
        throw error;
      }

      this.logger.warn(
        `[trace=${traceId}] Striga user create returned duplicate email for email=${email}; attempting cloud recovery.`,
      );

      const recoveredCloudUser = await this.findCloudUserByEmail(
        email,
        traceId,
      );
      if (!recoveredCloudUser) {
        this.logger.warn(
          `[trace=${traceId}] Duplicate-email recovery failed for email=${email}; Striga get-by-email did not return a user.`,
        );
        throw error;
      }

      const synced =
        await this.strigaUsersService.upsertFromCloudUser(recoveredCloudUser);
      this.logger.log(
        `[trace=${traceId}] Recovered duplicate Striga user for email=${email}; localSync=${synced ? 'ok' : 'skipped'}.`,
      );
      return;
    }
  }

  async onUserDeleted(payload: UserEventDto, traceId: string): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping user-deleted flow.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] Striga user-deleted event received for userId=${payload.userId}.`,
    );

    // TODO: Implement Striga user cleanup logic.
  }

  async onWebhookUserCreated(
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping webhook user-created flow.`,
      );
      return;
    }

    const externalId = this.resolveExternalId(payload);
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] Webhook user-created payload is missing user identifier; skipping.`,
      );
      return;
    }

    const cloudUser = await this.findCloudUserById(externalId, traceId);
    const source = cloudUser ?? payload;

    const synced = await this.strigaUsersService.upsertFromCloudUser(source);
    this.logger.log(
      `[trace=${traceId}] Webhook user-created sync completed for externalId=${externalId}; localSync=${synced ? 'ok' : 'skipped'}.`,
    );
  }

  private normalizeEmail(email: unknown): string {
    return String(email ?? '')
      .trim()
      .toLowerCase();
  }

  private resolveExternalId(payload: Record<string, unknown>): string {
    return String(
      payload.userId ?? payload.externalId ?? payload.id ?? '',
    ).trim();
  }

  private async resolveNames(
    payload: UserEventDto,
    traceId: string,
  ): Promise<{ firstName: string; lastName: string } | null> {
    let fallbackFirstName = String(payload.firstName ?? '').trim();
    let fallbackLastName = String(payload.lastName ?? '').trim();

    const appUserId = Number(payload.userId);
    if (!Number.isNaN(appUserId)) {
      const appUser = await this.usersService.findById(appUserId);
      if (!appUser) {
        this.logger.warn(
          `[trace=${traceId}] User ${payload.userId} not found; skipping Striga user workflow.`,
        );
        return null;
      }

      fallbackFirstName =
        String(appUser.firstName ?? '').trim() || fallbackFirstName;
      fallbackLastName =
        String(appUser.lastName ?? '').trim() || fallbackLastName;
    }

    return {
      firstName: fallbackFirstName,
      lastName: fallbackLastName,
    };
  }

  private async findCloudUserByEmail(
    email: string,
    traceId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.strigaService.getUserByEmail({ email });
      return this.extractObjectData(response?.data);
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      this.logger.debug(
        `[trace=${traceId}] Striga get-by-email returned no user for email=${email}: ${message}`,
      );
      return null;
    }
  }

  private async findCloudUserById(
    externalId: string,
    traceId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const response = await this.strigaService.getUserById(externalId);
      return this.extractObjectData(response?.data);
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      this.logger.warn(
        `[trace=${traceId}] Striga get-user-by-id failed for externalId=${externalId}; using webhook payload. reason=${message}`,
      );
      return null;
    }
  }

  private extractObjectData(data: unknown): Record<string, unknown> | null {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }

    return null;
  }

  private isDuplicateEmailError(error: unknown): boolean {
    const asAny = error as any;
    const response = asAny?.response ?? asAny?.getResponse?.();
    const text = JSON.stringify(response ?? {}).toLowerCase();

    return text.includes('duplicate') && text.includes('user.email');
  }

  private async emitStrigaUserEvent(
    event: StrigaUserInternalEvent,
    traceId: string,
    successMessage: string,
  ): Promise<void> {
    await this.internalEventsService.emit(this.dataSource.manager, {
      eventType: event.eventType,
      payload: { ...event.payload },
    });
    this.logger.log(`[trace=${traceId}] ${successMessage}`);
  }
}
