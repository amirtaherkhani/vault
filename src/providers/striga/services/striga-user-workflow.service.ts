import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountsService } from '../../../accounts/accounts.service';
import {
  AccountProviderName,
  AccountStatus,
  KycStatus,
} from '../../../accounts/types/account-enum.type';
import { InternalEventsService } from '../../../common/internal-events/internal-events.service';
import { UserEventDto } from '../../../users/dto/user.dto';
import { UsersService } from '../../../users/users.service';
import { StrigaKycWebhookEventDto } from '../dto/striga-kyc-webhook.dto';
import { StrigaCreateUserRequestDto } from '../dto/striga-request.dto';
import {
  StrigaUserEvent,
  StrigaUserEventPayload,
} from '../events/striga-user.event';
import { getStrigaPlaceholderMobile } from '../striga.helper';
import {
  StrigaUsersService,
  StrigaUserUpsertResult,
} from '../striga-users/striga-users.service';
import { StrigaService } from '../striga.service';
import {
  STRIGA_USER_CREATED_EVENT,
  STRIGA_USER_SYNCED_EVENT,
} from '../types/striga-event.type';

@Injectable()
export class StrigaUserWorkflowService {
  private readonly logger = new Logger(StrigaUserWorkflowService.name);

  constructor(
    private readonly strigaService: StrigaService,
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
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
        createdObject ?? (await this.findCloudUserByEmail(email, traceId));
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

  async processKycWebhook(
    payload: StrigaKycWebhookEventDto,
    traceId: string,
  ): Promise<void> {
    if (!this.strigaService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping KYC webhook flow.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] Striga KYC webhook received userId=${payload.userId ?? 'n/a'} status=${payload.status ?? 'n/a'} reason=${payload.reason ?? 'n/a'} type=${payload.type ?? payload.webhookType ?? 'n/a'}.`,
    );

    this.logger.debug(
      `[trace=${traceId}] Striga KYC webhook details=${JSON.stringify({
        currentTier: payload.currentTier ?? null,
        rejectionFinal: payload.rejectionFinal ?? null,
        details: payload.details ?? [],
        ts: payload.ts ?? null,
        tinCollected: payload.tinCollected ?? null,
        tinVerificationExpiryDate: payload.tinVerificationExpiryDate ?? null,
      })}`,
    );

    const externalId = String(payload.userId ?? '').trim();
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] KYC webhook payload missing userId; skipping Striga KYC workflow.`,
      );
      return;
    }

    let strigaUser = await this.strigaUsersService.findByExternalId(externalId);
    if (!strigaUser) {
      this.logger.debug(
        `[trace=${traceId}] Local Striga user not found for externalId=${externalId}; attempting cloud sync before KYC update.`,
      );
      const cloudUser = await this.findCloudUserById(externalId, traceId);
      if (cloudUser) {
        await this.syncUserFromProviderPayload(cloudUser, traceId, {
          source: 'webhook',
          trigger: 'webhook',
        });
        strigaUser = await this.strigaUsersService.findByExternalId(externalId);
      }
    }

    if (!strigaUser) {
      this.logger.warn(
        `[trace=${traceId}] Unable to resolve local Striga user for externalId=${externalId}; skipping KYC/account sync.`,
      );
      return;
    }

    const kycSnapshot =
      this.strigaUsersService.toKycSnapshotFromWebhook(payload);
    const updatedStrigaUser = await this.strigaUsersService.update(
      strigaUser.id,
      { kyc: kycSnapshot },
    );
    this.logger.debug(
      `[trace=${traceId}] Updated local Striga user KYC snapshot localId=${updatedStrigaUser?.id ?? strigaUser.id} externalId=${externalId}.`,
    );

    const tier1Approved = this.isTierApproved(payload.tier1?.status);
    const tier2Approved = this.isTierApproved(payload.tier2?.status);
    const accountKycStatus =
      tier1Approved && tier2Approved ? KycStatus.VERIFIED : KycStatus.PENDING;

    if (!tier1Approved && !tier2Approved) {
      this.logger.debug(
        `[trace=${traceId}] KYC tiers are not approved (tier1=${tier1Approved}, tier2=${tier2Approved}); account sync skipped.`,
      );
      return;
    }

    const appUser = await this.usersService.findByEmail(
      this.normalizeEmail(strigaUser.email),
    );
    if (!appUser?.id) {
      this.logger.warn(
        `[trace=${traceId}] No app user found for Striga email=${strigaUser.email}; skipping account upsert.`,
      );
      return;
    }

    const providerAccountId = await this.resolveStrigaAccountIdForUser(
      externalId,
      traceId,
    );

    const upsertedAccount = await this.accountsService.upsertByAccountId({
      accountId: providerAccountId,
      providerName: AccountProviderName.STRIGA,
      user: { id: appUser.id },
      kycStatus: accountKycStatus,
      label: 'striga',
      status: AccountStatus.ACTIVE,
      customerRefId: providerAccountId,
      name: `striga-${externalId}`,
    });

    this.logger.log(
      `[trace=${traceId}] Striga account synced accountId=${upsertedAccount.accountId} userId=${appUser.id} kycStatus=${upsertedAccount.kycStatus}.`,
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

  private isTierApproved(status?: string | null): boolean {
    return (
      String(status ?? '')
        .trim()
        .toUpperCase() === 'APPROVED'
    );
  }

  private extractAccountIdFromPayload(data: unknown): string | null {
    if (!data) {
      return null;
    }

    if (typeof data === 'string' || typeof data === 'number') {
      const value = String(data).trim();
      return value.length ? value : null;
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const nested = this.extractAccountIdFromPayload(item);
        if (nested) {
          return nested;
        }
      }
      return null;
    }

    if (typeof data !== 'object') {
      return null;
    }

    const record = data as Record<string, unknown>;
    const directKeys = ['accountId', 'walletAccountId', 'walletId'];
    for (const key of directKeys) {
      const value = record[key];
      if (typeof value === 'string' || typeof value === 'number') {
        const normalized = String(value).trim();
        if (normalized.length) {
          return normalized;
        }
      }
    }

    const listKeys = [
      'accounts',
      'wallets',
      'items',
      'data',
      'result',
      'account',
      'wallet',
    ];
    for (const key of listKeys) {
      if (typeof record[key] === 'undefined' || record[key] === null) {
        continue;
      }

      const nested = this.extractAccountIdFromPayload(record[key]);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  private async resolveStrigaAccountIdForUser(
    externalUserId: string,
    traceId: string,
  ): Promise<string> {
    try {
      this.logger.debug(
        `[trace=${traceId}] Resolving Striga account id via wallets/get/account userId=${externalUserId}.`,
      );
      const accountResponse = await this.strigaService.getWalletAccount({
        userId: externalUserId,
      });
      const accountId = this.extractAccountIdFromPayload(accountResponse?.data);
      if (accountId) {
        this.logger.debug(
          `[trace=${traceId}] Resolved Striga account id via wallets/get/account accountId=${accountId}.`,
        );
        return accountId;
      }
    } catch (error) {
      this.logger.debug(
        `[trace=${traceId}] wallets/get/account failed for userId=${externalUserId} reason=${this.formatError(error)}.`,
      );
    }

    try {
      this.logger.debug(
        `[trace=${traceId}] Resolving Striga account id via wallets/get/all userId=${externalUserId}.`,
      );
      const allWalletsResponse = await this.strigaService.getAllWallets({
        userId: externalUserId,
      });
      const accountId = this.extractAccountIdFromPayload(
        allWalletsResponse?.data,
      );
      if (accountId) {
        this.logger.debug(
          `[trace=${traceId}] Resolved Striga account id via wallets/get/all accountId=${accountId}.`,
        );
        return accountId;
      }
    } catch (error) {
      this.logger.debug(
        `[trace=${traceId}] wallets/get/all failed for userId=${externalUserId} reason=${this.formatError(error)}.`,
      );
    }

    this.logger.warn(
      `[trace=${traceId}] Could not resolve Striga account id from wallet endpoints; falling back to external user id=${externalUserId}.`,
    );
    return externalUserId;
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

    const upsertResult =
      await this.strigaUsersService.upsertFromCloudUser(sourceUser);
    const synced = upsertResult.user;
    const loggedExternalId = synced?.externalId ?? externalId ?? 'n/a';
    this.logger.debug(
      `[trace=${traceId}] Local upsert from provider payload completed operation=${upsertResult.operation} localId=${synced?.id ?? 'n/a'} externalId=${loggedExternalId} email=${String(sourceUser.email ?? 'n/a')}.`,
    );
    await this.emitUpsertEvent({
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
      upsertResult,
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

  private async emitUpsertEvent(input: {
    traceId: string;
    trigger: 'login' | 'created' | 'webhook';
    email: string | null;
    userId: string | null | undefined;
    upsertResult: StrigaUserUpsertResult;
    source: 'workflow' | 'webhook';
  }): Promise<void> {
    const synced = input.upsertResult.user;
    if (!synced?.id) {
      this.logger.debug(
        `[trace=${input.traceId}] Skipping Striga user event emission; local save was skipped operation=${input.upsertResult.operation}.`,
      );
      return;
    }

    const payload: StrigaUserEventPayload = {
      source: input.source,
      trigger: input.trigger,
      email: input.email,
      userId: input.userId ?? null,
      localId: synced.id,
      externalId: synced.externalId ?? null,
    };

    if (input.upsertResult.operation === 'created') {
      await this.emitStrigaEvent(
        StrigaUserEvent.userCreated(payload),
        input.traceId,
      );
      this.logger.debug(
        `[trace=${input.traceId}] Emitted ${STRIGA_USER_CREATED_EVENT} localId=${payload.localId} externalId=${payload.externalId}.`,
      );
      return;
    }

    if (input.upsertResult.operation === 'updated') {
      await this.emitStrigaEvent(
        StrigaUserEvent.userSynced(payload),
        input.traceId,
      );
      this.logger.debug(
        `[trace=${input.traceId}] Emitted ${STRIGA_USER_SYNCED_EVENT} localId=${payload.localId} externalId=${payload.externalId}.`,
      );
      return;
    }

    this.logger.debug(
      `[trace=${input.traceId}] Skipping Striga user event emission for operation=${input.upsertResult.operation}.`,
    );
  }
}
