import {
  BadRequestException,
  Injectable,
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

@Injectable()
export class StrigaUserService extends StrigaBaseService {
  private readonly defaultResponseRoles = [RoleEnum.admin, RoleEnum.user];

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
    const strigaUserId = String(payload.userId ?? '').trim();
    if (!strigaUserId) {
      throw new BadRequestException('userId is required.');
    }

    const localStrigaUser =
      await this.strigaUsersService.findByExternalId(strigaUserId);
    if (!localStrigaUser) {
      throw new NotFoundException('Striga user was not found.');
    }

    const providerResponse = await this.verifyEmailInProvider({
      userId: strigaUserId,
      verificationId: payload.verificationId,
    });
    const accepted = providerResponse?.success === true;

    if (accepted) {
      await this.strigaUsersService.updateKycByExternalId(strigaUserId, {
        ...(localStrigaUser.kyc ?? {}),
        emailVerified: true,
      });
    }

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
    const strigaUserId = String(payload.userId ?? '').trim();
    if (!strigaUserId) {
      throw new BadRequestException('userId is required.');
    }

    const localStrigaUser =
      await this.strigaUsersService.findByExternalId(strigaUserId);
    if (!localStrigaUser) {
      throw new NotFoundException('Striga user was not found.');
    }

    const providerResponse = await this.resendEmailInProvider({
      userId: strigaUserId,
    });

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
    const strigaUser = await this.strigaUsersService.findByUserId(userId);
    if (!strigaUser?.externalId) {
      throw new NotFoundException('Striga user not found for current user.');
    }

    const providerResponse = await this.resendSmsInProvider({
      userId: strigaUser.externalId,
    });

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
    return GroupPlainToInstance(StrigaUser, synced, this.defaultResponseRoles);
  }

  async updateUserForAdmin(
    payload: StrigaUpdateUserForAdminDto,
  ): Promise<StrigaUser> {
    const strigaUserId = String(payload.userId ?? '').trim();
    if (!strigaUserId) {
      throw new BadRequestException('userId is required.');
    }

    const providerResponse = await this.updateUserInProvider({
      ...payload,
      userId: strigaUserId,
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
    return GroupPlainToInstance(StrigaUser, synced, this.defaultResponseRoles);
  }

  async findKycTotalStatusForMe(
    req: RequestWithUser,
  ): Promise<StrigaKycTotalStatusDto> {
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

    return created as StrigaUser;
  }
}
