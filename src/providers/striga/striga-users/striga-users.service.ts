import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateStrigaUserDto } from './dto/create-striga-user.dto';
import { UpdateStrigaUserDto } from './dto/update-striga-user.dto';
import { StrigaUserRepository } from './infrastructure/persistence/striga-user.repository';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import { StrigaUser } from './domain/striga-user';
import { StrigaKycWebhookEventDto } from '../dto/striga-kyc-webhook.dto';

export type StrigaUserUpsertOperation =
  | 'created'
  | 'updated'
  | 'unchanged'
  | 'skipped';

export type StrigaUserUpsertResult = {
  operation: StrigaUserUpsertOperation;
  user: StrigaUser | null;
};

@Injectable()
export class StrigaUsersService {
  constructor(
    // Dependencies here
    private readonly strigaUserRepository: StrigaUserRepository,
  ) {}

  private normalizeMobile(
    mobile?: Record<string, unknown>,
  ): StrigaUser['mobile'] {
    return {
      countryCode:
        typeof mobile?.countryCode === 'string' ? mobile.countryCode : '',
      number: typeof mobile?.number === 'string' ? mobile.number : '',
    };
  }

  private normalizeAddress(
    address?: Record<string, unknown>,
  ): StrigaUser['address'] {
    return {
      addressLine1:
        typeof address?.addressLine1 === 'string' ? address.addressLine1 : '',
      addressLine2:
        typeof address?.addressLine2 === 'string' ? address.addressLine2 : '',
      city: typeof address?.city === 'string' ? address.city : '',
      state: typeof address?.state === 'string' ? address.state : '',
      country: typeof address?.country === 'string' ? address.country : '',
      postalCode:
        typeof address?.postalCode === 'string' ? address.postalCode : '',
    };
  }

  private normalizeKycFromCloud(
    kyc?: Record<string, unknown>,
  ): StrigaUser['kyc'] | undefined {
    if (!kyc || typeof kyc !== 'object' || Array.isArray(kyc)) {
      return undefined;
    }

    const normalizeTier = (tier: unknown) => {
      if (!tier || typeof tier !== 'object' || Array.isArray(tier)) {
        return undefined;
      }
      const tierObj = tier as Record<string, unknown>;
      return {
        status: typeof tierObj.status === 'string' ? tierObj.status : undefined,
      };
    };

    return {
      status: typeof kyc.status === 'string' ? kyc.status : null,
      tier0: normalizeTier(kyc.tier0) ?? null,
      tier1: normalizeTier(kyc.tier1) ?? null,
      tier2: normalizeTier(kyc.tier2) ?? null,
      tier3: normalizeTier(kyc.tier3) ?? null,
    };
  }

  toKycSnapshotFromWebhook(
    payload: StrigaKycWebhookEventDto,
  ): StrigaUser['kyc'] {
    return {
      status: payload.status ?? null,
      tier0: payload.tier0
        ? {
            status: payload.tier0.status,
          }
        : null,
      tier1: payload.tier1
        ? {
            status: payload.tier1.status,
          }
        : null,
      tier2: payload.tier2
        ? {
            status: payload.tier2.status,
          }
        : null,
      tier3: payload.tier3
        ? {
            status: payload.tier3.status,
          }
        : null,
    };
  }

  async updateKycByExternalId(
    externalId: StrigaUser['externalId'],
    kyc: StrigaUser['kyc'],
  ): Promise<StrigaUser | null> {
    const existing = await this.findByExternalId(externalId);
    if (!existing) {
      return null;
    }

    return this.update(existing.id, { kyc });
  }

  private hasUserChanges(
    current: StrigaUser,
    payload: UpdateStrigaUserDto,
  ): boolean {
    const normalizedCurrentEmail = String(current.email ?? '')
      .trim()
      .toLowerCase();
    const normalizedPayloadEmail = String(payload.email ?? '')
      .trim()
      .toLowerCase();

    if (normalizedCurrentEmail !== normalizedPayloadEmail) {
      return true;
    }

    if (String(current.firstName ?? '') !== String(payload.firstName ?? '')) {
      return true;
    }

    if (String(current.lastName ?? '') !== String(payload.lastName ?? '')) {
      return true;
    }

    const currentMobile = JSON.stringify(current.mobile ?? {});
    const payloadMobile = JSON.stringify(payload.mobile ?? {});
    if (currentMobile !== payloadMobile) {
      return true;
    }

    const currentAddress = JSON.stringify(current.address ?? {});
    const payloadAddress = JSON.stringify(payload.address ?? {});
    if (currentAddress !== payloadAddress) {
      return true;
    }

    if (typeof payload.kyc !== 'undefined') {
      const currentKyc = JSON.stringify(current.kyc ?? null);
      const payloadKyc = JSON.stringify(payload.kyc ?? null);
      if (currentKyc !== payloadKyc) {
        return true;
      }
    }

    return false;
  }

  async upsertFromCloudUser(
    cloudUser: Record<string, unknown>,
  ): Promise<StrigaUserUpsertResult> {
    const externalId = String(
      cloudUser.userId ?? cloudUser.externalId ?? '',
    ).trim();
    if (!externalId) {
      return { operation: 'skipped', user: null };
    }

    const email = String(cloudUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return { operation: 'skipped', user: null };
    }

    const firstName = String(cloudUser.firstName ?? '').trim() || 'Unknown';
    const lastName = String(cloudUser.lastName ?? '').trim() || 'Unknown';

    const payload: UpdateStrigaUserDto = {
      externalId,
      email,
      firstName,
      lastName,
      mobile: this.normalizeMobile(
        (cloudUser.mobile as Record<string, unknown>) ?? undefined,
      ),
      address: this.normalizeAddress(
        (cloudUser.address as Record<string, unknown>) ?? undefined,
      ),
      kyc: this.normalizeKycFromCloud(
        (cloudUser.KYC as Record<string, unknown>) ??
          (cloudUser.kyc as Record<string, unknown>) ??
          undefined,
      ),
    };

    const existingByExternalId = await this.findByExternalId(externalId);
    if (existingByExternalId) {
      if (!this.hasUserChanges(existingByExternalId, payload)) {
        return { operation: 'unchanged', user: existingByExternalId };
      }

      const updated = await this.update(existingByExternalId.id, payload);
      return { operation: 'updated', user: updated };
    }

    if (email) {
      const existingByEmail = await this.findByEmail(email);
      if (existingByEmail) {
        if (!this.hasUserChanges(existingByEmail, payload)) {
          return { operation: 'unchanged', user: existingByEmail };
        }

        const updated = await this.update(existingByEmail.id, payload);
        return { operation: 'updated', user: updated };
      }
    }

    const createPayload: CreateStrigaUserDto = {
      externalId,
      email,
      firstName,
      lastName,
      mobile: payload.mobile!,
      address: payload.address!,
      kyc: payload.kyc,
    };

    const created = await this.create(createPayload);
    return { operation: 'created', user: created };
  }

  async create(createStrigaUserDto: CreateStrigaUserDto) {
    // Do not remove comment below.
    // <creating-property />

    return this.strigaUserRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      externalId: createStrigaUserDto.externalId,

      email: createStrigaUserDto.email,

      lastName: createStrigaUserDto.lastName,

      firstName: createStrigaUserDto.firstName,

      mobile: createStrigaUserDto.mobile,

      address: createStrigaUserDto.address,

      kyc: createStrigaUserDto.kyc,
    });
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.strigaUserRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: StrigaUser['id']) {
    return this.strigaUserRepository.findById(id);
  }

  findByIds(ids: StrigaUser['id'][]) {
    return this.strigaUserRepository.findByIds(ids);
  }

  findByExternalId(externalId: StrigaUser['externalId']) {
    return this.strigaUserRepository.findUserByExternalId(externalId);
  }

  findByEmail(email: StrigaUser['email']) {
    return this.strigaUserRepository.findUserByEmail(email);
  }

  async findPhone(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    const user = await this.strigaUserRepository.findByIdOrExternalId(
      id,
      externalId,
    );

    return user?.mobile ?? null;
  }

  async findAddress(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    const user = await this.strigaUserRepository.findByIdOrExternalId(
      id,
      externalId,
    );

    return user?.address ?? null;
  }

  updatePhone(
    id: StrigaUser['id'] | undefined,
    externalId: StrigaUser['externalId'] | undefined,
    mobile: StrigaUser['mobile'],
  ) {
    return this.strigaUserRepository.updateByIdOrExternalId(id, externalId, {
      mobile,
    });
  }

  updateAddress(
    id: StrigaUser['id'] | undefined,
    externalId: StrigaUser['externalId'] | undefined,
    address: StrigaUser['address'],
  ) {
    return this.strigaUserRepository.updateByIdOrExternalId(id, externalId, {
      address,
    });
  }

  async update(
    id: StrigaUser['id'],

    updateStrigaUserDto: UpdateStrigaUserDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.strigaUserRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      externalId: updateStrigaUserDto.externalId,

      email: updateStrigaUserDto.email,

      lastName: updateStrigaUserDto.lastName,

      firstName: updateStrigaUserDto.firstName,

      mobile: updateStrigaUserDto.mobile,

      address: updateStrigaUserDto.address,

      kyc: updateStrigaUserDto.kyc,
    });
  }

  remove(id: StrigaUser['id']) {
    return this.strigaUserRepository.remove(id);
  }
}
