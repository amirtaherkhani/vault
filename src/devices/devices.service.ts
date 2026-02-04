import { UsersService } from '../users/users.service';
import { User } from '../users/domain/user';
import { CreateDeviceDto, CreateDeviceUserDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeviceRepository } from './infrastructure/persistence/device.repository';
import { IPaginationOptions } from '../utils/types/pagination-options.type';
import { Device } from './domain/device';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import {
  DeviceAdminResponseDto,
  DeviceUserResponseDto,
} from './dto/device-response.dto';
import { FilterDeviceDto, SortDeviceDto } from './dto/query-device.dto';
import {
  Injectable,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../utils/transformers/class.transformer';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class DevicesService {
  [x: string]: any;
  constructor(
    private readonly userService: UsersService,

    // Dependencies here
    private readonly deviceRepository: DeviceRepository,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<DeviceAdminResponseDto> {
    // Do not remove comment below.
    // <creating-property />

    const userObject = await this.userService.findById(createDeviceDto.user.id);
    if (!userObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notExists',
        },
      });
    }
    const user = userObject;

    const created = await this.deviceRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      isActive: createDeviceDto.isActive,

      model: createDeviceDto.model,

      appVersion: createDeviceDto.appVersion,

      osVersion: createDeviceDto.osVersion,

      platform: createDeviceDto.platform,

      deviceToken: createDeviceDto.deviceToken,

      user,
    });
    return GroupPlainToInstance(DeviceAdminResponseDto, created, [
      RoleEnum.admin,
    ]);
  }

  async createByUser(
    createDeviceUserDto: CreateDeviceUserDto,
    userJwtPayload: JwtPayloadType,
  ): Promise<DeviceUserResponseDto> {
    // Do not remove comment below.
    // <creating-property-by-user />

    const userObject = await this.userService.findById(userJwtPayload.id);
    if (!userObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'UserNotExists',
        },
      });
    }
    const user = userObject;

    const created = await this.deviceRepository.create({
      // Do not remove comment below.
      // <creating-property-payload-by-user />
      isActive: createDeviceUserDto.isActive,
      model: createDeviceUserDto.model,
      appVersion: createDeviceUserDto.appVersion,
      osVersion: createDeviceUserDto.osVersion,
      platform: createDeviceUserDto.platform,
      deviceToken: createDeviceUserDto.deviceToken,
      user,
    });
    return GroupPlainToInstance(DeviceUserResponseDto, created, [
      RoleEnum.user,
    ]);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<DeviceAdminResponseDto[]> {
    return this.deviceRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    }).then((devices) =>
      GroupPlainToInstances(DeviceAdminResponseDto, devices, [RoleEnum.admin]),
    );
  }

  async findById(
    id: Device['id'],
  ): Promise<DeviceAdminResponseDto | null> {
    const device = await this.deviceRepository.findById(id);
    return device
      ? GroupPlainToInstance(DeviceAdminResponseDto, device, [RoleEnum.admin])
      : null;
  }

  async findEntityById(id: Device['id']): Promise<Device | null> {
    return this.deviceRepository.findById(id);
  }

  async findByIds(ids: Device['id'][]): Promise<DeviceAdminResponseDto[]> {
    const devices = await this.deviceRepository.findByIds(ids);
    return GroupPlainToInstances(DeviceAdminResponseDto, devices, [
      RoleEnum.admin,
    ]);
  }

  async update(
    id: Device['id'],

    updateDeviceDto: UpdateDeviceDto,
  ): Promise<DeviceAdminResponseDto | null> {
    // Do not remove comment below.
    // <updating-property />

    let user: User | undefined = undefined;

    if (updateDeviceDto.user) {
      const userObject = await this.userService.findById(
        updateDeviceDto.user.id,
      );
      if (!userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'notExists',
          },
        });
      }
      user = userObject;
    }

    const updated = await this.deviceRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      isActive: updateDeviceDto.isActive,

      model: updateDeviceDto.model,

      appVersion: updateDeviceDto.appVersion,

      osVersion: updateDeviceDto.osVersion,

      platform: updateDeviceDto.platform,

      deviceToken: updateDeviceDto.deviceToken,

      user,
    });
    return updated
      ? GroupPlainToInstance(DeviceAdminResponseDto, updated, [RoleEnum.admin])
      : null;
  }

  async remove(id: Device['id']): Promise<void> {
    return this.deviceRepository.remove(id);
  }

  async findByme(
    userJwtPayload: JwtPayloadType,
  ): Promise<DeviceUserResponseDto[]> {
    const devices = await this.deviceRepository.findByUserId(userJwtPayload.id);
    return GroupPlainToInstances(DeviceUserResponseDto, devices, [
      RoleEnum.user,
    ]);
  }

  async findByUserId(userId: User['id']): Promise<DeviceAdminResponseDto[]> {
    const devices = await this.deviceRepository.findByUserId(userId);
    return GroupPlainToInstances(DeviceAdminResponseDto, devices, [
      RoleEnum.admin,
    ]);
  }

  async findActiveByMe(
    userJwtPayload: JwtPayloadType,
  ): Promise<DeviceUserResponseDto[]> {
    const devices = await this.deviceRepository.findByUserId(userJwtPayload.id);
    return GroupPlainToInstances(
      DeviceUserResponseDto,
      devices.filter((device) => device.isActive),
      [RoleEnum.user],
    );
  }

  async updateDeviceTokenByMe(
    deviceId: Device['id'],
    deviceToken: string,
    userJwtPayload: JwtPayloadType,
  ): Promise<DeviceUserResponseDto> {
    const device = await this.requireDeviceForUser(
      deviceId,
      userJwtPayload.id,
    );
    const updated = await this.deviceRepository.update(device.id, {
      deviceToken,
    });
    return GroupPlainToInstance(DeviceUserResponseDto, updated as Device, [
      RoleEnum.user,
    ]);
  }

  async updateDeviceActiveStatusByMe(
    deviceId: Device['id'],
    isActive: boolean,
    userJwtPayload: JwtPayloadType,
  ): Promise<DeviceUserResponseDto> {
    const device = await this.requireDeviceForUser(
      deviceId,
      userJwtPayload.id,
    );
    const updated = await this.deviceRepository.update(device.id, {
      isActive,
    });
    return GroupPlainToInstance(DeviceUserResponseDto, updated as Device, [
      RoleEnum.user,
    ]);
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterDeviceDto | null;
    sortOptions?: SortDeviceDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<DeviceAdminResponseDto[]> {
    return this.deviceRepository
      .findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    })
      .then((devices) =>
        GroupPlainToInstances(DeviceAdminResponseDto, devices, [
          RoleEnum.admin,
        ]),
      );
  }

  private async requireDeviceForUser(
    deviceId: Device['id'],
    userId: User['id'],
  ): Promise<Device> {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device || device.user?.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          device: 'notExists',
        },
      });
    }
    return device;
  }
}
