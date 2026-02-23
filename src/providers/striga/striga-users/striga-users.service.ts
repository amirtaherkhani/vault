import {
  // common
  Injectable,
} from '@nestjs/common';
import { CreateStrigaUserDto } from './dto/create-striga-user.dto';
import { UpdateStrigaUserDto } from './dto/update-striga-user.dto';
import { StrigaUserRepository } from './infrastructure/persistence/striga-user.repository';
import { IPaginationOptions } from '../../../utils/types/pagination-options.type';
import {
  StrigaUser,
  StrigaUserAddress,
  StrigaUserKyc,
  StrigaUserMobile,
} from './domain/striga-user';
import { UsersService } from '../../../users/users.service';
import { GroupPlainToInstances } from '../../../utils/transformers/class.transformer';
import { RoleEnum } from '../../../roles/roles.enum';

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
  private readonly defaultResponseRoles = [RoleEnum.admin, RoleEnum.user];

  constructor(
    // Dependencies here
    private readonly strigaUserRepository: StrigaUserRepository,
    private readonly usersService: UsersService,
  ) {}

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
    return this.strigaUserRepository
      .findAllWithPagination({
        paginationOptions: {
          page: paginationOptions.page,
          limit: paginationOptions.limit,
        },
      })
      .then((rows) =>
        GroupPlainToInstances(StrigaUser, rows, this.defaultResponseRoles),
      );
  }

  async findById(id: StrigaUser['id']) {
    const user = await this.strigaUserRepository.findById(id);
    if (!user) {
      return null;
    }

    const [result] = GroupPlainToInstances(
      StrigaUser,
      [user],
      this.defaultResponseRoles,
    );
    return result ?? null;
  }

  async findByIds(ids: StrigaUser['id'][]) {
    return GroupPlainToInstances(
      StrigaUser,
      await this.strigaUserRepository.findByIds(ids),
      this.defaultResponseRoles,
    );
  }

  findByExternalId(externalId: StrigaUser['externalId']) {
    return this.strigaUserRepository.findUserByExternalId(externalId);
  }

  findByEmail(email: StrigaUser['email']) {
    return this.strigaUserRepository.findUserByEmail(email);
  }

  async filter(
    externalId?: StrigaUser['externalId'],
    email?: StrigaUser['email'],
    firstName?: StrigaUser['firstName'],
    lastName?: StrigaUser['lastName'],
  ) {
    const rows = await this.strigaUserRepository.filter(
      externalId,
      email,
      firstName,
      lastName,
    );
    return GroupPlainToInstances(StrigaUser, rows, this.defaultResponseRoles);
  }

  async findByUserId(userId?: number | string): Promise<StrigaUser | null> {
    if (typeof userId === 'undefined' || userId === null) {
      return null;
    }

    const appUser = await this.usersService.findById(userId);
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

  async resolveStrigaUserForMe(
    userId?: number | string,
  ): Promise<StrigaUser | null> {
    const user = await this.findByUserId(userId);
    if (!user) {
      return null;
    }

    const [result] = GroupPlainToInstances(
      StrigaUser,
      [user],
      this.defaultResponseRoles,
    );
    return result ?? null;
  }

  async findKyc(id?: StrigaUser['id'], externalId?: StrigaUser['externalId']) {
    const kyc = await this.strigaUserRepository.findKycByIdOrExternalId(
      id,
      externalId,
    );
    if (!kyc) {
      return null;
    }

    const [result] = GroupPlainToInstances(
      StrigaUserKyc,
      [kyc],
      this.defaultResponseRoles,
    );
    return result ?? null;
  }

  async findPhone(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    const user = await this.strigaUserRepository.findByIdOrExternalId(
      id,
      externalId,
    );

    if (!user?.mobile) {
      return null;
    }
    const [result] = GroupPlainToInstances(
      StrigaUserMobile,
      [user.mobile],
      this.defaultResponseRoles,
    );
    return result ?? null;
  }

  async findAddress(
    id?: StrigaUser['id'],
    externalId?: StrigaUser['externalId'],
  ) {
    const user = await this.strigaUserRepository.findByIdOrExternalId(
      id,
      externalId,
    );

    if (!user?.address) {
      return null;
    }
    const [result] = GroupPlainToInstances(
      StrigaUserAddress,
      [user.address],
      this.defaultResponseRoles,
    );
    return result ?? null;
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
