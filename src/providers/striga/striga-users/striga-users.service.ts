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
import { UsersService } from '../../../users/users.service';

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
    private readonly usersService: UsersService,
  ) {}

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

  filter(
    externalId?: StrigaUser['externalId'],
    email?: StrigaUser['email'],
    firstName?: StrigaUser['firstName'],
    lastName?: StrigaUser['lastName'],
  ) {
    return this.strigaUserRepository.filter(
      externalId,
      email,
      firstName,
      lastName,
    );
  }

  async resolveStrigaUserForMe(
    authUserId?: number | string,
  ): Promise<StrigaUser | null> {
    if (typeof authUserId === 'undefined' || authUserId === null) {
      return null;
    }

    const appUser = await this.usersService.findById(authUserId);
    if (!appUser) {
      return null;
    }

    const email = String(appUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return null;
    }

    return this.findByEmail(email);
  }

  findKyc(id?: StrigaUser['id'], externalId?: StrigaUser['externalId']) {
    return this.strigaUserRepository.findKycByIdOrExternalId(id, externalId);
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

  updateContactByExternalId(
    externalId: StrigaUser['externalId'],
    payload: {
      mobile?: StrigaUser['mobile'];
      address?: StrigaUser['address'];
    },
  ) {
    const updatePayload: Partial<StrigaUser> = {};

    if (typeof payload.mobile !== 'undefined') {
      updatePayload.mobile = payload.mobile;
    }
    if (typeof payload.address !== 'undefined') {
      updatePayload.address = payload.address;
    }

    if (!Object.keys(updatePayload).length) {
      return Promise.resolve(null);
    }

    return this.strigaUserRepository.updateByIdOrExternalId(
      undefined,
      externalId,
      updatePayload,
    );
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
