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
import { StrigaKycWebhookEventDto } from '../dto/striga.webhook.dto';
import { StrigaCreateUserRequestDto } from '../dto/striga-base.request.dto';
import { StrigaCloudUserResponseDto } from '../dto/striga-base.response.dto';
import { StrigaUserEvent } from '../events/striga-user.event';
import { StrigaUserService } from './striga-kyc.service';
import { StrigaWalletService } from './striga-wallet.service';
import {
  buildStrigaKycSnapshotFromWebhook,
  getStrigaPlaceholderMobile,
} from '../striga.helper';
import {
  buildFindAllWalletsPayload,
  extractPrimaryWalletSummaryFromPayload,
  resolveWalletsDateRangeFromProviderUser,
  StrigaWalletSummary,
} from '../helpers/striga-wallet.helper';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaUser } from '../striga-users/domain/striga-user';

@Injectable()
export class StrigaUserWorkflowService {
  private readonly logger = new Logger(StrigaUserWorkflowService.name);

  constructor(
    private readonly strigaUserService: StrigaUserService,
    private readonly strigaWalletService: StrigaWalletService,
    private readonly usersService: UsersService,
    private readonly accountsService: AccountsService,
    private readonly strigaUsersService: StrigaUsersService,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Handles vero login/create events and restores Striga user/account state.
   *
   * Recovery priority:
   * 1) Local Striga user by email.
   * 2) Cloud Striga user by externalId/email and local upsert.
   * 3) Create cloud Striga user when absent, then local upsert.
   * 4) Recover local Striga account based on effective KYC tier statuses.
   */
  async processVeroUserEvent(
    payload: UserEventDto,
    traceId: string,
    trigger: 'login' | 'created',
  ): Promise<void> {
    this.logger.debug(
      `[trace=${traceId}] Starting vero-user-${trigger} flow userId=${payload.userId ?? 'n/a'} email=${payload.email ?? 'n/a'}.`,
    );

    if (!this.strigaUserService.getEnabled()) {
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
        `[trace=${traceId}] Local Striga user exists for email=${email}; starting recovery flow.`,
      );
      const effectiveUser =
        (await this.recoverLocalStrigaUserFromCloud(
          localUser.externalId,
          email,
          traceId,
          trigger,
        )) ?? localUser;
      await this.recoverLocalAccountFromStrigaState(
        effectiveUser,
        traceId,
        `vero-${trigger}`,
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
      let synced = await this.syncUserFromProviderPayload(cloudUser, traceId, {
        source: 'workflow',
        trigger,
      });
      if (!synced) {
        this.logger.warn(
          `[trace=${traceId}] Cloud user sync returned empty local result for email=${email}; retrying via getUserByEmail.`,
        );
        const retryCloudUser = await this.findCloudUserByEmail(email, traceId);
        if (retryCloudUser) {
          synced = await this.syncUserFromProviderPayload(
            retryCloudUser,
            traceId,
            {
              source: 'workflow',
              trigger,
            },
          );
        }
      }
      if (synced) {
        await this.recoverLocalAccountFromStrigaState(
          synced,
          traceId,
          `vero-${trigger}`,
        );
      } else {
        this.logger.error(
          `[trace=${traceId}] Cloud user was found for email=${email} but local sync failed after retry.`,
        );
      }
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
        await this.strigaUserService.createUserInProvider(createPayload);
      const createdObject = this.extractObjectData(createdResponse?.data);
      const createdExternalId = this.resolveExternalId(
        (createdObject ?? {}) as Record<string, unknown>,
      );
      const createdSource =
        createdObject &&
        typeof createdObject === 'object' &&
        !Array.isArray(createdObject)
          ? ({
              ...createPayload,
              ...createdObject,
              userId:
                createdExternalId ||
                String(
                  (createdObject as Record<string, unknown>).userId ?? '',
                ).trim() ||
                undefined,
            } as Record<string, unknown>)
          : null;
      this.logger.debug(
        `[trace=${traceId}] Striga createUser succeeded email=${email} responseStatus=${createdResponse?.status ?? 'n/a'} responseSuccess=${String(createdResponse?.success ?? 'n/a')} responseData=${createdResponse?.data ? 'present' : 'empty'} externalId=${String(createdObject?.userId ?? createdObject?.externalId ?? createdObject?.id ?? 'n/a')}.`,
      );
      const cloudFallback = await this.findCloudUserByEmail(email, traceId);
      const syncSource = createdSource ?? cloudFallback;
      if (!syncSource) {
        this.logger.warn(
          `[trace=${traceId}] Striga user created for email=${email} but cloud payload was empty; local sync skipped.`,
        );
        return;
      }
      let synced = await this.syncUserFromProviderPayload(syncSource, traceId, {
        source: 'workflow',
        trigger,
      });
      if (!synced) {
        this.logger.warn(
          `[trace=${traceId}] Created Striga user but initial local sync returned empty for email=${email}; retrying via getUserByEmail.`,
        );
        const retryCloudUser = await this.findCloudUserByEmail(email, traceId);
        if (retryCloudUser) {
          synced = await this.syncUserFromProviderPayload(
            retryCloudUser,
            traceId,
            {
              source: 'workflow',
              trigger,
            },
          );
        }
      }
      if (synced) {
        await this.recoverLocalAccountFromStrigaState(
          synced,
          traceId,
          `vero-${trigger}`,
        );
      } else {
        this.logger.error(
          `[trace=${traceId}] Striga user create succeeded for email=${email} but local sync failed after retry.`,
        );
      }
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

      let synced = await this.syncUserFromProviderPayload(
        recoveredCloudUser,
        traceId,
        {
          source: 'workflow',
          trigger,
        },
      );
      if (!synced) {
        this.logger.warn(
          `[trace=${traceId}] Duplicate-email recovery sync returned empty local result for email=${email}; retrying via getUserByEmail.`,
        );
        const retryCloudUser = await this.findCloudUserByEmail(email, traceId);
        if (retryCloudUser) {
          synced = await this.syncUserFromProviderPayload(
            retryCloudUser,
            traceId,
            {
              source: 'workflow',
              trigger,
            },
          );
        }
      }
      if (synced) {
        await this.recoverLocalAccountFromStrigaState(
          synced,
          traceId,
          `vero-${trigger}`,
        );
      } else {
        this.logger.error(
          `[trace=${traceId}] Duplicate-email recovery found cloud user for email=${email} but local sync failed after retry.`,
        );
      }
      this.logger.log(
        `[trace=${traceId}] Recovered duplicate Striga user for email=${email}.`,
      );
      return;
    }
  }

  async processProviderUserPayload(
    payload: Record<string, unknown>,
    traceId: string,
  ): Promise<void> {
    this.logger.debug(
      `[trace=${traceId}] Starting provider-user sync flow source=webhook rawUserId=${String(payload.userId ?? payload.externalId ?? payload.id ?? 'n/a')}.`,
    );
    if (!this.strigaUserService.getEnabled()) {
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

  async processUserDeleted(
    payload: UserEventDto,
    traceId: string,
  ): Promise<void> {
    if (!this.strigaUserService.getEnabled()) {
      this.logger.warn(
        `[trace=${traceId}] Striga service is disabled; skipping user-deleted flow.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] Striga user-deleted event received for userId=${payload.userId}.`,
    );

    // TODO: Implement Striga user cleanup logic.
    await Promise.resolve();
  }

  /**
   * Applies incoming Striga KYC webhook to local Striga user snapshot and
   * then recovers local account state from the effective KYC tiers.
   */
  async processKycWebhook(
    payload: StrigaKycWebhookEventDto,
    traceId: string,
  ): Promise<void> {
    if (!this.strigaUserService.getEnabled()) {
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
      this.logger.warn(
        `[trace=${traceId}] Local Striga user not found for externalId=${externalId}; attempting recovery from provider.`,
      );
      const cloudUser = await this.findCloudUserById(externalId, traceId);
      if (cloudUser) {
        await this.syncUserFromProviderPayload(cloudUser, traceId, {
          source: 'workflow',
          trigger: 'webhook',
        });
        strigaUser = await this.strigaUsersService.findByExternalId(externalId);
      }
      if (!strigaUser) {
        this.logger.warn(
          `[trace=${traceId}] Local Striga user still missing after recovery for externalId=${externalId}; skipping KYC/account sync.`,
        );
        return;
      }
    }

    const kycSnapshot = buildStrigaKycSnapshotFromWebhook(payload);
    const previousTierStatuses = this.extractTierStatuses(
      strigaUser.kyc ?? null,
    );
    const mergedKycSnapshot = {
      ...(strigaUser.kyc ?? {}),
      ...kycSnapshot,
    };
    const updatedStrigaUser = await this.strigaUsersService.update(
      strigaUser.id,
      { kyc: mergedKycSnapshot },
    );
    const effectiveStrigaUser =
      (updatedStrigaUser as StrigaUser | null) ?? strigaUser;
    const currentTierStatuses = this.extractTierStatuses(
      effectiveStrigaUser.kyc ?? mergedKycSnapshot,
    );
    this.logger.debug(
      `[trace=${traceId}] Updated local Striga user KYC snapshot localId=${updatedStrigaUser?.id ?? strigaUser.id} externalId=${externalId}.`,
    );
    await this.emitKycTierUpdatedEvents(
      effectiveStrigaUser,
      previousTierStatuses,
      currentTierStatuses,
      traceId,
    );

    await this.recoverLocalAccountFromStrigaState(
      effectiveStrigaUser,
      traceId,
      'kyc-webhook',
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

  private extractTierStatuses(
    kyc: StrigaUser['kyc'] | Record<string, unknown> | null | undefined,
  ): Record<string, string | null> {
    if (!kyc || typeof kyc !== 'object' || Array.isArray(kyc)) {
      return {};
    }

    const statuses: Record<string, string | null> = {};
    for (const [key, value] of Object.entries(kyc)) {
      if (!/^tier\d+$/i.test(key)) {
        continue;
      }

      const tierValue =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, unknown>).status
          : null;

      statuses[key] = this.normalizeTierStatus(tierValue);
    }

    return statuses;
  }

  private normalizeTierStatus(value: unknown): string | null {
    const status = String(value ?? '')
      .trim()
      .toUpperCase();
    return status.length ? status : null;
  }

  private async emitKycTierUpdatedEvents(
    strigaUser: StrigaUser,
    previousTierStatuses: Record<string, string | null>,
    currentTierStatuses: Record<string, string | null>,
    traceId: string,
  ): Promise<void> {
    const tierKeys = Array.from(
      new Set([
        ...Object.keys(previousTierStatuses),
        ...Object.keys(currentTierStatuses),
      ]),
    ).sort((a, b) => {
      const aNumber = Number.parseInt(a.replace(/\D+/g, ''), 10);
      const bNumber = Number.parseInt(b.replace(/\D+/g, ''), 10);
      if (Number.isNaN(aNumber) || Number.isNaN(bNumber)) {
        return a.localeCompare(b);
      }
      return aNumber - bNumber;
    });

    this.logger.debug(
      `[trace=${traceId}] Evaluating kyc:tier:update emission localId=${strigaUser.id ?? 'n/a'} externalId=${strigaUser.externalId ?? 'n/a'} tiers=${tierKeys.join(',') || 'none'}.`,
    );

    let emittedCount = 0;
    for (const tier of tierKeys) {
      const previousStatus = previousTierStatuses[tier] ?? null;
      const currentStatus = currentTierStatuses[tier] ?? null;
      if (previousStatus === currentStatus) {
        continue;
      }

      await this.internalEventsService.emit(
        this.dataSource.manager,
        StrigaUserEvent.userKycTierUpdated({
          source: 'workflow',
          trigger: 'webhook',
          email: strigaUser.email ?? null,
          userId: strigaUser.externalId ?? null,
          localId: strigaUser.id ?? null,
          externalId: strigaUser.externalId ?? null,
          tier,
          previousStatus,
          currentStatus,
        }).getEvent(),
      );

      this.logger.log(
        `[trace=${traceId}] Emitted internal event kyc:tier:update localId=${strigaUser.id ?? 'n/a'} externalId=${strigaUser.externalId ?? 'n/a'} tier=${tier} previous=${previousStatus ?? 'null'} current=${currentStatus ?? 'null'}.`,
      );
      emittedCount += 1;
    }

    if (!emittedCount) {
      this.logger.debug(
        `[trace=${traceId}] No KYC tier status change detected; kyc:tier:update was not emitted.`,
      );
    }
  }

  /**
   * Resolves the Striga wallet identifier for local account upsert.
   *
   * Striga model:
   * user -> wallets -> wallet.accounts[*]
   *
   * Local convention in this service:
   * - `account.accountId` stores Striga `walletId` (not wallet accountId).
   * - If local walletId already exists, verify it via `/wallets/get`.
   * - If inaccessible, fallback to `/wallets/get/all` by Striga external user id.
   * - Only first wallet is stored locally.
   */
  private async resolveStrigaWalletForUser(
    externalUserId: string,
    traceId: string,
    localWalletId?: string | null,
  ): Promise<StrigaWalletSummary | null> {
    const normalizedLocalWalletId = String(localWalletId ?? '').trim();
    if (normalizedLocalWalletId) {
      try {
        this.logger.debug(
          `[trace=${traceId}] Resolving Striga wallet via wallets/get/account walletRef=${normalizedLocalWalletId}.`,
        );
        // IMPORTANT: local `account.accountId` is Striga `walletId`.
        // Primary lookup for existing local wallet reference uses /wallets/get/account.
        const walletResponse =
          await this.strigaWalletService.findWalletAccountFromProvider({
            accountId: normalizedLocalWalletId,
          });
        const wallet = extractPrimaryWalletSummaryFromPayload(
          walletResponse?.data,
        );
        if (wallet) {
          this.logger.debug(
            `[trace=${traceId}] Resolved Striga wallet via wallets/get/account walletId=${wallet.walletId} subAccounts=${wallet.subAccountIds.length}.`,
          );
          return wallet;
        }
      } catch (error) {
        this.logger.debug(
          `[trace=${traceId}] wallets/get/account failed for walletRef=${normalizedLocalWalletId} reason=${this.formatError(error)}.`,
        );
      }
    }

    const providerUser = await this.findCloudUserById(externalUserId, traceId);
    const requestTs = Date.now();
    const dateRange = resolveWalletsDateRangeFromProviderUser(
      providerUser,
      requestTs,
    );
    const payload = buildFindAllWalletsPayload({
      userId: externalUserId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    try {
      // IMPORTANT: if no usable local wallet id exists, recover wallet via /wallets/get/all using Striga external user id.
      // startDate is provider user createdAt, endDate is current request timestamp, and page must be 1.
      this.logger.debug(
        `[trace=${traceId}] Resolving Striga wallet via wallets/get/all userId=${externalUserId} page=${String(payload.page)} startDate=${String(payload.startDate)} endDate=${String(payload.endDate)}.`,
      );
      const allWalletsResponse =
        await this.strigaWalletService.findAllWalletsFromProvider(payload);
      const wallet = extractPrimaryWalletSummaryFromPayload(
        allWalletsResponse?.data,
      );
      if (wallet) {
        if ((wallet.walletCount ?? 0) > 1) {
          this.logger.debug(
            `[trace=${traceId}] Multiple wallets detected count=${wallet.walletCount}; selected first wallet in provider list walletId=${wallet.walletId} createdAt=${wallet.createdAt ?? 'n/a'}.`,
          );
        }
        this.logger.debug(
          `[trace=${traceId}] Resolved Striga wallet via wallets/get/all walletId=${wallet.walletId} subAccounts=${wallet.subAccountIds.length} count=${wallet.walletCount ?? 'n/a'}.`,
        );
        return wallet;
      }
      this.logger.debug(
        `[trace=${traceId}] wallets/get/all returned no wallet for userId=${externalUserId}.`,
      );
    } catch (error) {
      this.logger.debug(
        `[trace=${traceId}] wallets/get/all failed for userId=${externalUserId} reason=${this.formatError(error)}.`,
      );
    }

    if (normalizedLocalWalletId) {
      this.logger.warn(
        `[trace=${traceId}] Could not validate wallet in provider and wallet list recovery failed; reusing local walletId=${normalizedLocalWalletId}.`,
      );
      return {
        walletId: normalizedLocalWalletId,
        subAccountIds: [],
        subCurrencies: [],
        createdAt: null,
        walletCount: null,
      };
    }

    this.logger.warn(
      `[trace=${traceId}] Could not resolve Striga wallet id from provider for userId=${externalUserId}.`,
    );
    return null;
  }

  /**
   * Refreshes local Striga user from provider by externalId first, then email fallback.
   */
  private async recoverLocalStrigaUserFromCloud(
    externalId: string,
    email: string,
    traceId: string,
    trigger: 'login' | 'created',
  ): Promise<StrigaUser | null> {
    let cloudUser: Record<string, unknown> | null = null;

    if (externalId) {
      cloudUser = await this.findCloudUserById(externalId, traceId);
    }

    if (!cloudUser) {
      cloudUser = await this.findCloudUserByEmail(email, traceId);
    }

    if (!cloudUser) {
      this.logger.debug(
        `[trace=${traceId}] Recovery cloud lookup found no user email=${email} externalId=${externalId || 'n/a'}.`,
      );
      return null;
    }

    const synced = await this.syncUserFromProviderPayload(cloudUser, traceId, {
      source: 'workflow',
      trigger,
    });

    if (!synced) {
      this.logger.warn(
        `[trace=${traceId}] Recovery cloud sync returned empty local user for email=${email}.`,
      );
      return null;
    }

    this.logger.debug(
      `[trace=${traceId}] Recovery cloud sync completed localId=${synced.id} externalId=${synced.externalId}.`,
    );
    return synced;
  }

  /**
   * Restores local STRIGA wallet-reference account using effective local KYC tier statuses.
   *
   * Rule:
   * - Skip when neither tier1 nor tier2 is approved.
   * - Create/Update local account with PENDING until both tier1 and tier2 are approved.
   *
   * Local convention:
   * - `account.accountId` stores Striga `walletId` (first wallet).
   * - Currency-level Striga accounts remain a sub-concept under that wallet.
   */
  private async recoverLocalAccountFromStrigaState(
    strigaUser: StrigaUser,
    traceId: string,
    source: string,
  ): Promise<void> {
    const externalId = String(strigaUser.externalId ?? '').trim();
    if (!externalId) {
      this.logger.warn(
        `[trace=${traceId}] ${source}: missing Striga externalId; account recovery skipped.`,
      );
      return;
    }

    const tier1Status = strigaUser.kyc?.tier1?.status ?? null;
    const tier2Status = strigaUser.kyc?.tier2?.status ?? null;
    const tier1Approved = this.isTierApproved(tier1Status);
    const tier2Approved = this.isTierApproved(tier2Status);

    this.logger.debug(
      `[trace=${traceId}] ${source}: effective tier statuses tier1=${String(tier1Status ?? 'n/a')} tier2=${String(tier2Status ?? 'n/a')}.`,
    );

    if (!tier1Approved && !tier2Approved) {
      this.logger.debug(
        `[trace=${traceId}] ${source}: account recovery skipped because tier1/tier2 are not approved.`,
      );
      return;
    }

    const accountKycStatus =
      tier1Approved && tier2Approved ? KycStatus.VERIFIED : KycStatus.PENDING;

    const appUser = await this.usersService.findByEmail(
      this.normalizeEmail(strigaUser.email),
    );
    if (!appUser?.id) {
      this.logger.warn(
        `[trace=${traceId}] ${source}: app user not found by email=${strigaUser.email}; account recovery skipped.`,
      );
      return;
    }

    const existingStrigaAccount = await this.accountsService
      .findByMeAndProviderName(appUser.id, AccountProviderName.STRIGA)
      .catch(() => null);
    // IMPORTANT: for Striga rows, local `account.accountId` stores walletId (not currency sub-account id).
    const currentLocalWalletId = String(
      existingStrigaAccount?.accountId ?? '',
    ).trim();
    const providerWallet = await this.resolveStrigaWalletForUser(
      externalId,
      traceId,
      currentLocalWalletId || null,
    );
    if (!providerWallet) {
      this.logger.warn(
        `[trace=${traceId}] ${source}: wallet id not resolved for externalId=${externalId}; account recovery skipped.`,
      );
      return;
    }
    const providerWalletId = providerWallet.walletId;
    this.logger.debug(
      `[trace=${traceId}] ${source}: wallet selected walletId=${providerWalletId} subAccounts=${providerWallet.subAccountIds.length} currencies=${providerWallet.subCurrencies.join(',') || 'n/a'}.`,
    );

    const upsertedAccount = existingStrigaAccount
      ? await this.accountsService.update(existingStrigaAccount.id, {
          // IMPORTANT: persist Striga walletId into local `account.accountId`.
          accountId: providerWalletId,
          providerName: AccountProviderName.STRIGA,
          user: { id: appUser.id },
          kycStatus: accountKycStatus,
          label: 'striga',
          status: AccountStatus.ACTIVE,
          // Keep the same wallet reference in customerRefId for provider tracing.
          customerRefId: providerWalletId,
          name: 'wallet-1',
        })
      : await this.accountsService.upsertByAccountId({
          // IMPORTANT: persist Striga walletId into local `account.accountId`.
          accountId: providerWalletId,
          providerName: AccountProviderName.STRIGA,
          user: { id: appUser.id },
          kycStatus: accountKycStatus,
          label: 'striga',
          status: AccountStatus.ACTIVE,
          // Keep the same wallet reference in customerRefId for provider tracing.
          customerRefId: providerWalletId,
          name: 'wallet-1',
        });
    if (!upsertedAccount) {
      this.logger.warn(
        `[trace=${traceId}] ${source}: local account upsert/update returned empty for userId=${appUser.id} walletId=${providerWalletId}.`,
      );
      return;
    }

    this.logger.log(
      `[trace=${traceId}] ${source}: local Striga account recovered walletId=${upsertedAccount.accountId} userId=${appUser.id} kycStatus=${upsertedAccount.kycStatus}.`,
    );
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
      const response = await this.strigaUserService.findUserByEmailFromProvider(
        { email },
      );
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
      const response =
        await this.strigaUserService.findUserByIdFromProvider(externalId);
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

  /**
   * Upserts a provider user payload into local Striga user table.
   * Returns the local synced user when successful.
   */
  private async syncUserFromProviderPayload(
    payload: Record<string, unknown>,
    traceId: string,
    eventMeta: {
      source: 'workflow' | 'webhook';
      trigger: 'login' | 'created' | 'webhook';
    },
  ): Promise<StrigaUser | null> {
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

    const email =
      typeof sourceUser.email === 'string'
        ? this.normalizeEmail(sourceUser.email)
        : '';
    if (!email) {
      this.logger.warn(
        `[trace=${traceId}] Provider user payload is missing email; local sync skipped.`,
      );
      return null;
    }

    const cloudUserId =
      this.resolveExternalId(sourceUser as Record<string, unknown>) || '';
    if (!cloudUserId) {
      this.logger.warn(
        `[trace=${traceId}] Provider user payload is missing userId/externalId/id; local sync skipped.`,
      );
      return null;
    }

    const normalizedSourceUser = {
      ...sourceUser,
      userId: cloudUserId,
    };

    const synced = await this.strigaUserService.upsertStrigaUserFromProvider(
      normalizedSourceUser as unknown as StrigaCloudUserResponseDto,
      {
        source: eventMeta.source,
        trigger: eventMeta.trigger,
        userId: cloudUserId || externalId || null,
      },
    );
    const loggedExternalId = synced.externalId ?? externalId ?? 'n/a';
    this.logger.debug(
      `[trace=${traceId}] Local upsert from provider payload completed localId=${synced.id ?? 'n/a'} externalId=${loggedExternalId} email=${email}.`,
    );

    if (externalId) {
      this.logger.log(
        `[trace=${traceId}] Provider user sync completed for externalId=${externalId}; localSync=ok.`,
      );
    } else {
      this.logger.debug(
        `[trace=${traceId}] Provider user sync completed without externalId; localSync=ok.`,
      );
    }

    return synced;
  }
}
