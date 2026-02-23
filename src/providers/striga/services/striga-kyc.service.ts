import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StrigaCloudUserResponseDto } from '../dto/striga-base.response.dto';
import {
  StrigaUserEvent,
  StrigaUserEventPayload,
} from '../events/striga-user.event';
import { StrigaUser } from '../striga-users/domain/striga-user';
import { CreateStrigaUserDto } from '../striga-users/dto/create-striga-user.dto';
import { UpdateStrigaUserDto } from '../striga-users/dto/update-striga-user.dto';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaBaseService } from './striga-base.service';
import { StrigaService } from '../striga.service';
import { InternalEventsService } from '../../../common/internal-events/internal-events.service';
import { GroupPlainToInstance } from '../../../utils/transformers/class.transformer';
import { RoleEnum } from '../../../roles/roles.enum';
import {
  StrigaVerificationActionDto,
  StrigaVerificationAcceptedDto,
  StrigaResendEmailForAdminDto,
  StrigaVerifyEmailForAdminDto,
  StrigaVerifyEmailForMeDto,
  StrigaVerifyMobileForMeDto,
} from '../dto/striga-verification.dto';
import {
  StrigaUpdateUserForAdminDto,
  StrigaUpdateUserForMeDto,
} from '../dto/striga-user-update.dto';
import { StrigaKycTotalStatusDto } from '../dto/striga-kyc-status.dto';
import { RequestWithUser } from '../../../utils/types/object.type';
import {
  StrigaStartKycForAdminDto,
  StrigaStartKycForMeDto,
  StrigaStartKycResponseDto,
} from '../dto/striga-start-kyc.dto';

@Injectable()
export class StrigaUserService extends StrigaBaseService {
  private readonly defaultResponseRoles = [RoleEnum.admin, RoleEnum.user];
  private readonly logger = new Logger(StrigaUserService.name);

  constructor(
    strigaService: StrigaService,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
    private readonly strigaUsersService: StrigaUsersService,
  ) {
    super(strigaService);
  }

  async verifyEmailForMe(
    req: RequestWithUser,
    payload: StrigaVerifyEmailForMeDto,
  ): Promise<StrigaVerificationAcceptedDto> {
    this.logger.debug(
      `verifyEmailForMe: start appUserId=${String(req.user?.id ?? 'n/a')}`,
    );

    const appUserId = req.user?.id;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.verifyEmailInProvider({
      userId: strigaUser.externalId,
      verificationId: payload.verificationId,
    });
    const accepted = providerResponse?.success === true;

    if (accepted) {
      await this.strigaUsersService.updateKycByExternalId(
        strigaUser.externalId,
        {
          ...(strigaUser.kyc ?? {}),
          emailVerified: true,
        },
      );
    }

    this.logger.debug(
      `verifyEmailForMe: done externalId=${strigaUser.externalId} accepted=${String(accepted)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationAcceptedDto,
      {
        accepted,
      },
      this.defaultResponseRoles,
    );
  }

  async verifyEmailForAdmin(
    payload: StrigaVerifyEmailForAdminDto,
  ): Promise<StrigaVerificationAcceptedDto> {
    this.logger.debug(
      `verifyEmailForAdmin: start externalId=${String(payload.externalId ?? 'n/a')}`,
    );

    const externalId = String(payload.externalId ?? '').trim();
    if (!externalId) {
      throw new BadRequestException('externalId is required.');
    }

    const localStrigaUser =
      await this.strigaUsersService.findByExternalId(externalId);
    if (!localStrigaUser) {
      throw new NotFoundException('Striga user was not found.');
    }

    const providerResponse = await this.verifyEmailInProvider({
      userId: externalId,
      verificationId: payload.verificationId,
    });
    const accepted = providerResponse?.success === true;

    if (accepted) {
      await this.strigaUsersService.updateKycByExternalId(externalId, {
        ...(localStrigaUser.kyc ?? {}),
        emailVerified: true,
      });
    }

    this.logger.debug(
      `verifyEmailForAdmin: done externalId=${externalId} accepted=${String(accepted)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationAcceptedDto,
      {
        accepted,
      },
      this.defaultResponseRoles,
    );
  }

  async resendEmailForMe(
    req: RequestWithUser,
  ): Promise<StrigaVerificationAcceptedDto> {
    this.logger.debug(
      `resendEmailForMe: start appUserId=${String(req.user?.id ?? 'n/a')}`,
    );

    const appUserId = req.user?.id;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.resendEmailInProvider({
      userId: strigaUser.externalId,
    });

    this.logger.debug(
      `resendEmailForMe: done externalId=${strigaUser.externalId} accepted=${String(providerResponse?.success === true)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationAcceptedDto,
      {
        accepted: providerResponse?.success === true,
      },
      this.defaultResponseRoles,
    );
  }

  async resendEmailForAdmin(
    payload: StrigaResendEmailForAdminDto,
  ): Promise<StrigaVerificationAcceptedDto> {
    this.logger.debug(
      `resendEmailForAdmin: start externalId=${String(payload.externalId ?? 'n/a')}`,
    );

    const externalId = String(payload.externalId ?? '').trim();
    if (!externalId) {
      throw new BadRequestException('externalId is required.');
    }

    const localStrigaUser =
      await this.strigaUsersService.findByExternalId(externalId);
    if (!localStrigaUser) {
      throw new NotFoundException('Striga user was not found.');
    }

    const providerResponse = await this.resendEmailInProvider({
      userId: externalId,
    });

    this.logger.debug(
      `resendEmailForAdmin: done externalId=${externalId} accepted=${String(providerResponse?.success === true)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationAcceptedDto,
      {
        accepted: providerResponse?.success === true,
      },
      this.defaultResponseRoles,
    );
  }

  async verifyMobileForMe(
    userId: number | string | undefined,
    payload: StrigaVerifyMobileForMeDto,
  ): Promise<StrigaVerificationActionDto> {
    this.logger.debug(
      `verifyMobileForMe: start appUserId=${String(userId ?? 'n/a')}`,
    );

    const strigaUser = await this.strigaUsersService.findByUserId(userId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.verifyMobileInProvider({
      userId: strigaUser.externalId,
      verificationCode: payload.verificationCode,
    });
    const accepted = providerResponse?.success === true;

    if (accepted) {
      await this.strigaUsersService.updateKycByExternalId(
        strigaUser.externalId,
        {
          ...(strigaUser.kyc ?? {}),
          mobileVerified: true,
        },
      );
    }

    this.logger.debug(
      `verifyMobileForMe: done externalId=${strigaUser.externalId} accepted=${String(accepted)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationActionDto,
      {
        channel: 'mobile',
        action: 'verify',
        accepted,
      },
      this.defaultResponseRoles,
    );
  }

  async resendMobileForMe(
    userId: number | string | undefined,
  ): Promise<StrigaVerificationActionDto> {
    this.logger.debug(
      `resendMobileForMe: start appUserId=${String(userId ?? 'n/a')}`,
    );

    const strigaUser = await this.strigaUsersService.findByUserId(userId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.resendSmsInProvider({
      userId: strigaUser.externalId,
    });

    this.logger.debug(
      `resendMobileForMe: done externalId=${strigaUser.externalId} accepted=${String(providerResponse?.success === true)}`,
    );

    return GroupPlainToInstance(
      StrigaVerificationActionDto,
      {
        channel: 'mobile',
        action: 'resend',
        accepted: providerResponse?.success === true,
      },
      this.defaultResponseRoles,
    );
  }

  async updateUserForMe(
    req: RequestWithUser,
    payload: StrigaUpdateUserForMeDto,
  ): Promise<StrigaUser> {
    this.logger.debug(
      `updateUserForMe: start appUserId=${String(req.user?.id ?? 'n/a')}`,
    );

    const appUserId = req.user?.id;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.updateUserInProvider({
      ...payload,
      userId: strigaUser.externalId,
    });

    const strigaCloudUser =
      providerResponse?.data as StrigaCloudUserResponseDto | null;
    if (!strigaCloudUser || typeof strigaCloudUser !== 'object') {
      throw new BadRequestException('Invalid Striga update user response.');
    }

    const sourceUser = {
      ...strigaCloudUser,
      dateOfBirth: strigaCloudUser.dateOfBirth ?? payload.dateOfBirth,
    };

    const synced = await this.upsertStrigaUserFromProvider(sourceUser);
    this.logger.debug(
      `updateUserForMe: done externalId=${synced.externalId} localId=${synced.id}`,
    );
    return GroupPlainToInstance(StrigaUser, synced, this.defaultResponseRoles);
  }

  async updateUserForAdmin(
    payload: StrigaUpdateUserForAdminDto,
  ): Promise<StrigaUser> {
    this.logger.debug(
      `updateUserForAdmin: start externalId=${String(payload.externalId ?? 'n/a')}`,
    );

    const externalId = String(payload.externalId ?? '').trim();
    if (!externalId) {
      throw new BadRequestException('externalId is required.');
    }

    const providerResponse = await this.updateUserInProvider({
      ...payload,
      userId: externalId,
    });

    const strigaCloudUser =
      providerResponse?.data as StrigaCloudUserResponseDto | null;
    if (!strigaCloudUser || typeof strigaCloudUser !== 'object') {
      throw new BadRequestException('Invalid Striga update user response.');
    }

    const sourceUser = {
      ...strigaCloudUser,
      dateOfBirth: strigaCloudUser.dateOfBirth ?? payload.dateOfBirth,
    };

    const synced = await this.upsertStrigaUserFromProvider(sourceUser);
    this.logger.debug(
      `updateUserForAdmin: done externalId=${synced.externalId} localId=${synced.id}`,
    );
    return GroupPlainToInstance(StrigaUser, synced, this.defaultResponseRoles);
  }

  async startKycForMe(
    req: RequestWithUser,
    payload: StrigaStartKycForMeDto,
  ): Promise<StrigaStartKycResponseDto> {
    this.logger.debug(
      `startKycForMe: start appUserId=${String(req.user?.id ?? 'n/a')} tier=${payload.tier}`,
    );

    const appUserId = req.user?.id;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    this.validateStartKycPrerequisites(strigaUser);

    const providerResponse = await this.startKycInProvider({
      externalId: strigaUser.externalId,
      tier: payload.tier,
    });

    const data = providerResponse?.data as Record<string, unknown> | null;
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid Striga start KYC response.');
    }

    const responsePayload = {
      ...data,
      externalId: String(data.userId ?? strigaUser.externalId ?? '').trim(),
    };

    this.logger.debug(
      `startKycForMe: done externalId=${strigaUser.externalId} tier=${payload.tier}`,
    );

    return GroupPlainToInstance(
      StrigaStartKycResponseDto,
      responsePayload,
      this.defaultResponseRoles,
    );
  }

  async startKycForAdmin(
    payload: StrigaStartKycForAdminDto,
  ): Promise<StrigaStartKycResponseDto> {
    this.logger.debug(
      `startKycForAdmin: start appUserId=${String(payload.userId ?? 'n/a')} tier=${payload.tier}`,
    );

    const appUserId = payload.userId;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('userId is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user was not found.');
    }

    this.validateStartKycPrerequisites(strigaUser);

    const providerResponse = await this.startKycInProvider({
      externalId: strigaUser.externalId,
      tier: payload.tier,
    });

    const data = providerResponse?.data as Record<string, unknown> | null;
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Invalid Striga start KYC response.');
    }

    const responsePayload = {
      ...data,
      externalId: String(data.userId ?? strigaUser.externalId ?? '').trim(),
    };

    this.logger.debug(
      `startKycForAdmin: done appUserId=${String(appUserId)} externalId=${strigaUser.externalId} tier=${payload.tier}`,
    );

    return GroupPlainToInstance(
      StrigaStartKycResponseDto,
      responsePayload,
      this.defaultResponseRoles,
    );
  }

  async findKycTotalStatusForMe(
    req: RequestWithUser,
  ): Promise<StrigaKycTotalStatusDto> {
    this.logger.debug(
      `findKycTotalStatusForMe: start appUserId=${String(req.user?.id ?? 'n/a')}`,
    );

    const appUserId = req.user?.id;
    if (typeof appUserId === 'undefined' || appUserId === null) {
      throw new BadRequestException('Authenticated user is required.');
    }

    const strigaUser = await this.strigaUsersService.findByUserId(appUserId);
    if (!strigaUser) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const toStatus = (value?: string | null): string =>
      String(value ?? '')
        .trim()
        .toUpperCase();

    const kyc = strigaUser.kyc;
    const approved = Boolean(
      kyc &&
        kyc.emailVerified === true &&
        kyc.mobileVerified === true &&
        toStatus(kyc.status) === 'APPROVED' &&
        toStatus(kyc.tier0?.status) === 'APPROVED' &&
        toStatus(kyc.tier1?.status) === 'APPROVED' &&
        toStatus(kyc.tier2?.status) === 'APPROVED' &&
        toStatus(kyc.tier3?.status) === 'APPROVED',
    );

    this.logger.debug(
      `findKycTotalStatusForMe: done appUserId=${String(appUserId)} approved=${String(approved)}`,
    );

    return GroupPlainToInstance(
      StrigaKycTotalStatusDto,
      { approved },
      this.defaultResponseRoles,
    );
  }

  /**
   * Upsert local Striga user from provider payload.
   *
   * Rules:
   * - Local `externalId` is always equal to provider `userId`.
   * - Local lookup is performed by provider email.
   * - If a local row exists for that email, it is always updated.
   * - If no local row exists, a new row is created.
   */
  async upsertStrigaUserFromProvider(
    strigaCloudUser: StrigaCloudUserResponseDto,
    context: {
      source?: StrigaUserEventPayload['source'];
      trigger?: StrigaUserEventPayload['trigger'];
      userId?: string | null;
    } = {},
  ): Promise<StrigaUser> {
    this.logger.debug(
      `upsertStrigaUserFromProvider: start providerUserId=${String(strigaCloudUser.userId ?? 'n/a')} email=${String(strigaCloudUser.email ?? 'n/a')}`,
    );

    const externalId = String(strigaCloudUser.userId ?? '').trim();
    if (!externalId) {
      throw new BadRequestException('strigaCloudUser.userId is required.');
    }

    const email = String(strigaCloudUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      throw new BadRequestException('strigaCloudUser.email is required.');
    }

    const firstName =
      String(strigaCloudUser.firstName ?? '').trim() || 'Unknown';

    const lastName = String(strigaCloudUser.lastName ?? '').trim() || 'Unknown';
    const mobile = strigaCloudUser.mobile as StrigaUser['mobile'] | undefined;

    const address = strigaCloudUser.address as
      | StrigaUser['address']
      | undefined;
    const dateOfBirth = strigaCloudUser.dateOfBirth as
      | StrigaUser['dateOfBirth']
      | undefined;

    const payload = strigaCloudUser as unknown as Record<string, unknown>;

    const kycSource =
      (strigaCloudUser.kyc as Record<string, unknown> | undefined) ??
      (payload.KYC as Record<string, unknown> | undefined);
    const kyc =
      kycSource && typeof kycSource === 'object' && !Array.isArray(kycSource)
        ? {
            emailVerified:
              typeof kycSource.emailVerified === 'boolean'
                ? kycSource.emailVerified
                : false,
            mobileVerified:
              typeof kycSource.mobileVerified === 'boolean'
                ? kycSource.mobileVerified
                : false,
            status:
              typeof kycSource.status === 'string' ? kycSource.status : null,
            tier0:
              kycSource.tier0 &&
              typeof kycSource.tier0 === 'object' &&
              !Array.isArray(kycSource.tier0)
                ? {
                    status:
                      typeof (kycSource.tier0 as Record<string, unknown>)
                        .status === 'string'
                        ? (kycSource.tier0 as Record<string, unknown>).status
                        : undefined,
                  }
                : null,
            tier1:
              kycSource.tier1 &&
              typeof kycSource.tier1 === 'object' &&
              !Array.isArray(kycSource.tier1)
                ? {
                    status:
                      typeof (kycSource.tier1 as Record<string, unknown>)
                        .status === 'string'
                        ? (kycSource.tier1 as Record<string, unknown>).status
                        : undefined,
                  }
                : null,
            tier2:
              kycSource.tier2 &&
              typeof kycSource.tier2 === 'object' &&
              !Array.isArray(kycSource.tier2)
                ? {
                    status:
                      typeof (kycSource.tier2 as Record<string, unknown>)
                        .status === 'string'
                        ? (kycSource.tier2 as Record<string, unknown>).status
                        : undefined,
                  }
                : null,
            tier3:
              kycSource.tier3 &&
              typeof kycSource.tier3 === 'object' &&
              !Array.isArray(kycSource.tier3)
                ? {
                    status:
                      typeof (kycSource.tier3 as Record<string, unknown>)
                        .status === 'string'
                        ? (kycSource.tier3 as Record<string, unknown>).status
                        : undefined,
                  }
                : null,
          }
        : undefined;

    const providerUser = {
      externalId,
      email,
      firstName,
      lastName,
      mobile,
      address,
      dateOfBirth,
      kyc,
    };

    const existingByEmail = await this.strigaUsersService.findByEmail(
      providerUser.email,
    );
    if (existingByEmail) {
      const updateDto = Object.assign(new UpdateStrigaUserDto(), providerUser);
      const updated = await this.strigaUsersService.update(
        existingByEmail.id,
        updateDto,
      );

      const eventPayload: StrigaUserEventPayload = {
        source: context.source ?? 'workflow',
        trigger: context.trigger ?? 'webhook',
        email,
        userId: context.userId ?? externalId,
        localId: updated?.id ?? null,
        externalId: updated?.externalId ?? externalId,
      };
      await this.internalEventsService.emit(
        this.dataSource.manager,
        StrigaUserEvent.userSynced(eventPayload).getEvent(),
      );

      this.logger.debug(
        `upsertStrigaUserFromProvider: updated localId=${updated?.id ?? 'n/a'} externalId=${updated?.externalId ?? externalId}`,
      );

      return updated as StrigaUser;
    }

    const createDto = Object.assign(new CreateStrigaUserDto(), providerUser);
    const created = await this.strigaUsersService.create(createDto);

    const eventPayload: StrigaUserEventPayload = {
      source: context.source ?? 'workflow',
      trigger: context.trigger ?? 'webhook',
      email,
      userId: context.userId ?? externalId,
      localId: created?.id ?? null,
      externalId: created?.externalId ?? externalId,
    };
    await this.internalEventsService.emit(
      this.dataSource.manager,
      StrigaUserEvent.userCreated(eventPayload).getEvent(),
    );

    this.logger.debug(
      `upsertStrigaUserFromProvider: created localId=${created?.id ?? 'n/a'} externalId=${created?.externalId ?? externalId}`,
    );

    return created as StrigaUser;
  }

  private validateStartKycPrerequisites(strigaUser: StrigaUser): void {
    const externalId = String(strigaUser.externalId ?? '').trim();

    if (strigaUser.kyc?.emailVerified !== true) {
      this.logger.warn(
        `startKyc validation failed externalId=${externalId}: emailVerified is not true`,
      );
      throw new BadRequestException(
        'Email must be verified before starting KYC.',
      );
    }

    if (strigaUser.kyc?.mobileVerified !== true) {
      this.logger.warn(
        `startKyc validation failed externalId=${externalId}: mobileVerified is not true`,
      );
      throw new BadRequestException(
        'Mobile must be verified before starting KYC.',
      );
    }

    const dateOfBirth = strigaUser.dateOfBirth;
    const hasDateOfBirth =
      !!dateOfBirth &&
      Number.isInteger(Number(dateOfBirth.year)) &&
      Number.isInteger(Number(dateOfBirth.month)) &&
      Number.isInteger(Number(dateOfBirth.day));
    if (!hasDateOfBirth) {
      this.logger.warn(
        `startKyc validation failed externalId=${externalId}: dateOfBirth is missing`,
      );
      throw new BadRequestException(
        'Date of birth is required before starting KYC.',
      );
    }

    const address = strigaUser.address;
    const hasAddress =
      !!address &&
      typeof address.addressLine1 === 'string' &&
      address.addressLine1.trim().length > 0 &&
      typeof address.city === 'string' &&
      address.city.trim().length > 0 &&
      typeof address.country === 'string' &&
      address.country.trim().length > 0 &&
      typeof address.postalCode === 'string' &&
      address.postalCode.trim().length > 0;

    if (!hasAddress) {
      this.logger.warn(
        `startKyc validation failed externalId=${externalId}: address is missing or incomplete`,
      );
      throw new BadRequestException('Address is required before starting KYC.');
    }
  }
}
