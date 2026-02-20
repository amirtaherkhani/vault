import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InternalEventsService } from '../../../common/internal-events/internal-events.service';
import { UserEventDto } from '../../../users/dto/user.dto';
import { UsersService } from '../../../users/users.service';
import { StrigaCreateUserRequestDto } from '../dto/striga-request.dto';
import {
  StrigaUserEvent,
  StrigaUserEventPayload,
} from '../events/striga-user.event';
import { getStrigaPlaceholderMobile } from '../striga.helper';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaService } from '../striga.service';
import { STRIGA_USER_SYNCED_EVENT } from '../types/striga-event.type';

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

  async processVeroUserEvent(
    payload: UserEventDto,
    traceId: string,
    trigger: 'login' | 'created',
  ): Promise<void> {
    this.logger.debug(
      `[trace=${traceId}] Starting vero-user-${trigger} flow userId=${payload.userId ?? 'n/a'} email=${payload.email ?? 'n/a'}.`,
    );

    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping vero-user-${trigger} flow.`,
      );
      return;
    }

    const email = this.normalizeEmail(payload.email);
    this.logger.debug(
      `[trace=${traceId}] Parsed vero-user-${trigger} payload userId=${payload.userId ?? 'n/a'} normalizedEmail=${email || 'empty'}.`,
    );
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Missing email in vero-user-${trigger} payload; skipping Striga user workflow.`,
      );
      return;
    }

    const localUser = await this.strigaUsersService.findByEmail(email);
    this.logger.debug(
      `[trace=${traceId}] Local Striga user lookup completed email=${email} found=${localUser ? 'yes' : 'no'}.`,
    );
    if (localUser) {
      this.logger.log(
        `[trace=${traceId}] Striga user already exists locally for email=${email}; skipping vero-user-${trigger} workflow.`,
      );
      return;
    }

    const cloudUser = await this.findCloudUserByEmail(email, traceId);
    this.logger.debug(
      `[trace=${traceId}] Cloud Striga user lookup completed email=${email} found=${cloudUser ? 'yes' : 'no'}.`,
    );
    if (cloudUser) {
      this.logger.debug(
        `[trace=${traceId}] Cloud user found for email=${email}; starting sync to local db.`,
      );
      await this.syncUserFromProviderPayload(cloudUser, traceId, {
        source: 'workflow',
        trigger,
      });
      this.logger.log(
        `[trace=${traceId}] Synced Striga user from cloud for email=${email}.`,
      );
      return;
    }

    const names = await this.resolveNames(payload, traceId);
    if (!names) {
      return;
    }
    this.logger.debug(
      `[trace=${traceId}] Resolved fallback names for create flow firstName=${names.firstName ? 'set' : 'empty'} lastName=${names.lastName ? 'set' : 'empty'}.`,
    );

    const createPayload: StrigaCreateUserRequestDto = {
      firstName: names.firstName || 'Unknown',
      lastName: names.lastName || 'Unknown',
      email,
      mobile: getStrigaPlaceholderMobile(),
    };
    this.logger.debug(
      `[trace=${traceId}] Prepared create payload email=${email} firstName=${createPayload.firstName} lastName=${createPayload.lastName} mobileCountryCode=${createPayload.mobile?.countryCode ?? 'n/a'} mobileNumber=${createPayload.mobile?.number ?? 'n/a'}.`,
    );

    try {
      this.logger.debug(
        `[trace=${traceId}] Calling Striga createUser email=${email}.`,
      );
      const createdResponse =
        await this.strigaService.createUser(createPayload);
      const createdObject = this.extractObjectData(createdResponse?.data);
      this.logger.debug(
        `[trace=${traceId}] Striga createUser succeeded email=${email} responseStatus=${createdResponse?.status ?? 'n/a'} responseSuccess=${String(createdResponse?.success ?? 'n/a')} responseData=${createdResponse?.data ? 'present' : 'empty'} externalId=${String(createdObject?.userId ?? createdObject?.externalId ?? createdObject?.id ?? 'n/a')}.`,
      );
      const createdSource =
        createdObject ??
        (await this.findCloudUserByEmail(email, traceId));
      if (!createdSource) {
        this.logger.warn(
          `[trace=${traceId}] Striga user created for email=${email} but cloud payload was empty; local sync skipped.`,
        );
        return;
      }
      await this.syncUserFromProviderPayload(createdSource, traceId, {
        source: 'workflow',
        trigger,
      });
      this.logger.log(
        `[trace=${traceId}] Created Striga user and saved locally for email=${email}.`,
      );
      return;
    } catch (error) {
      this.logger.warn(
        `[trace=${traceId}] Striga createUser failed email=${email} details=${this.formatError(error)}.`,
      );
      if (!this.isDuplicateEmailError(error)) {
        this.logger.debug(
          `[trace=${traceId}] Striga createUser failed with non-duplicate error email=${email}.`,
        );
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

      await this.syncUserFromProviderPayload(recoveredCloudUser, traceId, {
        source: 'workflow',
        trigger,
      });
      this.logger.log(
        `[trace=${traceId}] Recovered duplicate Striga user for email=${email}.`,
      );
      return;
    }
  }

  async processUserDeleted(
    payload: UserEventDto,
    traceId: string,
  ): Promise<void> {
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

  async processProviderUserPayload(
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<void> {
    this.logger.debug(
      `[trace=${traceId}] Starting provider-user sync flow source=webhook rawUserId=${String(payload.userId ?? payload.externalId ?? payload.id ?? 'n/a')}.`,
    );
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping provider user sync flow.`,
      );
      return;
    }
    await this.syncUserFromProviderPayload(payload, traceId, {
      source: 'webhook',
      trigger: 'webhook',
    });
    this.logger.debug(
      `[trace=${traceId}] Provider-user sync flow finished source=webhook.`,
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
      this.logger.debug(
        `[trace=${traceId}] Resolving app user names userId=${appUserId}.`,
      );
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
      this.logger.debug(
        `[trace=${traceId}] Calling Striga getUserByEmail email=${email}.`,
      );
      const response = await this.strigaService.getUserByEmail({ email });
      const user = this.extractObjectData(response?.data);
      this.logger.debug(
        `[trace=${traceId}] Striga getUserByEmail completed email=${email} found=${user ? 'yes' : 'no'} status=${response?.status ?? 'n/a'} success=${String(response?.success ?? 'n/a')}.`,
      );
      return user;
    } catch (error) {
      this.logger.debug(
        `[trace=${traceId}] Striga get-by-email returned no user for email=${email}: ${this.formatError(error)}`,
      );
      return null;
    }
  }

  private async findCloudUserById(
    externalId: string,
    traceId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      this.logger.debug(
        `[trace=${traceId}] Calling Striga getUserById externalId=${externalId}.`,
      );
      const response = await this.strigaService.getUserById(externalId);
      const user = this.extractObjectData(response?.data);
      this.logger.debug(
        `[trace=${traceId}] Striga getUserById completed externalId=${externalId} found=${user ? 'yes' : 'no'} status=${response?.status ?? 'n/a'} success=${String(response?.success ?? 'n/a')}.`,
      );
      return user;
    } catch (error) {
      this.logger.warn(
        `[trace=${traceId}] Striga get-user-by-id failed for externalId=${externalId}; using webhook payload. reason=${this.formatError(error)}`,
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

  private formatError(error: unknown): string {
    const asAny = error as any;
    const status =
      asAny?.status ??
      asAny?.response?.statusCode ??
      asAny?.response?.status ??
      asAny?.getStatus?.();
    const response =
      asAny?.response ??
      asAny?.getResponse?.() ??
      asAny?.message ??
      String(error);

    try {
      return `status=${status ?? 'n/a'} response=${JSON.stringify(response)}`;
    } catch {
      return `status=${status ?? 'n/a'} response=${String(response)}`;
    }
  }

  private async syncUserFromProviderPayload(
    payload: Record<string, unknown>,
    traceId: string,
    eventMeta: {
      source: 'workflow' | 'webhook';
      trigger: 'login' | 'created' | 'webhook';
    },
  ): Promise<void> {
    const externalId = this.resolveExternalId(payload);
    this.logger.debug(
      `[trace=${traceId}] Syncing provider payload source=${eventMeta.source} trigger=${eventMeta.trigger} externalId=${externalId || 'n/a'}.`,
    );
    let sourceUser = payload;

    if (externalId) {
      const cloudUser = await this.findCloudUserById(externalId, traceId);
      sourceUser = cloudUser ?? payload;
    } else if (eventMeta.source === 'webhook') {
      this.logger.warn(
        `[trace=${traceId}] Provider user payload is missing user identifier; using raw payload for local sync.`,
      );
    }

    const synced =
      await this.strigaUsersService.upsertFromCloudUser(sourceUser);
    const loggedExternalId = synced?.externalId ?? externalId ?? 'n/a';
    this.logger.debug(
      `[trace=${traceId}] Local upsert from provider payload completed result=${synced?.id ? 'saved' : 'skipped'} localId=${synced?.id ?? 'n/a'} externalId=${loggedExternalId} email=${String(sourceUser.email ?? 'n/a')}.`,
    );
    await this.emitSyncedEventIfSaved({
      traceId,
      email:
        typeof sourceUser.email === 'string'
          ? this.normalizeEmail(sourceUser.email)
          : null,
      userId:
        typeof sourceUser.userId === 'string' ||
        typeof sourceUser.userId === 'number'
          ? String(sourceUser.userId)
          : null,
      synced,
      source: eventMeta.source,
      trigger: eventMeta.trigger,
    });

    if (externalId) {
      this.logger.log(
        `[trace=${traceId}] Provider user sync completed for externalId=${externalId}; localSync=${synced ? 'ok' : 'skipped'}.`,
      );
    } else {
      this.logger.debug(
        `[trace=${traceId}] Provider user sync completed without externalId; localSync=${synced ? 'ok' : 'skipped'}.`,
      );
    }
  }

  private async emitStrigaEvent(
    event: StrigaUserEvent,
    traceId: string,
  ): Promise<void> {
    this.logger.debug(
      `[trace=${traceId}] Emitting internal event type=${event.eventType} payloadKeys=${Object.keys(event.payload ?? {}).join(',')}.`,
    );
    await this.internalEventsService.emit(this.dataSource.manager, {
      eventType: event.eventType,
      payload: event.payload,
    });
    this.logger.debug(
      `[trace=${traceId}] Internal event emitted type=${event.eventType}.`,
    );
  }

  private async emitSyncedEventIfSaved(input: {
    traceId: string;
    trigger: 'login' | 'created' | 'webhook';
    email: string | null;
    userId: string | null | undefined;
    synced: { id?: string; externalId?: string } | null;
    source: 'workflow' | 'webhook';
  }): Promise<void> {
    if (!input.synced?.id) {
      this.logger.debug(
        `[trace=${input.traceId}] Skipping ${STRIGA_USER_SYNCED_EVENT}; local save was skipped.`,
      );
      return;
    }

    const payload: StrigaUserEventPayload = {
      source: input.source,
      trigger: input.trigger,
      email: input.email,
      userId: input.userId ?? null,
      localId: input.synced.id,
      externalId: input.synced.externalId ?? null,
    };

    await this.emitStrigaEvent(
      StrigaUserEvent.userSynced(payload),
      input.traceId,
    );
    this.logger.debug(
      `[trace=${input.traceId}] Emitted ${STRIGA_USER_SYNCED_EVENT} localId=${payload.localId} externalId=${payload.externalId}.`,
    );
  }
}
