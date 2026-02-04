import {
  FilterNotificationDto,
  SortNotificationDto,
} from './dto/query-notification.dto';
import { DevicesService } from '../devices/devices.service';
import { Device } from '../devices/domain/device';

import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { IPaginationOptions } from '../utils/types/pagination-options.type';
import { Notification } from './domain/notification';
import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { NotificationCategory } from './types/notification-enum.type';
import { User } from '../users/domain/user';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../utils/transformers/class.transformer';
import { RoleEnum } from '../roles/roles.enum';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationBulkResultDto } from './dto/notification-bulk-result.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(forwardRef(() => DevicesService))
    private readonly deviceService: DevicesService,

    // Dependencies here
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    // Do not remove comment below.
    // <creating-property />

    const deviceObject = await this.deviceService.findEntityById(
      createNotificationDto.device.id,
    );
    if (!deviceObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          device: 'notExists',
        },
      });
    }
    const device = deviceObject;

    const created = await this.notificationRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      category: createNotificationDto.category || NotificationCategory.GENERAL,

      isRead: createNotificationDto.isRead,

      isDelivered: createNotificationDto.isDelivered,

      data: createNotificationDto.data,

      topic: createNotificationDto.topic,

      message: createNotificationDto.message,

      title: createNotificationDto.title,

      device,
    });
    return GroupPlainToInstance(NotificationResponseDto, created, [
      RoleEnum.admin,
    ]);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<NotificationResponseDto[]> {
    return this.notificationRepository
      .findAllWithPagination({
        paginationOptions: {
          page: paginationOptions.page,
          limit: paginationOptions.limit,
        },
      })
      .then((notifications) =>
        GroupPlainToInstances(NotificationResponseDto, notifications, [
          RoleEnum.admin,
        ]),
      );
  }

  async findById(
    id: Notification['id'],
  ): Promise<NotificationResponseDto | null> {
    const notification = await this.notificationRepository.findById(id);
    return notification
      ? GroupPlainToInstance(NotificationResponseDto, notification, [
          RoleEnum.admin,
        ])
      : null;
  }

  async findByIds(
    ids: Notification['id'][],
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.findByIds(ids);
    return GroupPlainToInstances(NotificationResponseDto, notifications, [
      RoleEnum.admin,
    ]);
  }

  async update(
    id: Notification['id'],

    updateNotificationDto: UpdateNotificationDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    let device: Device | undefined = undefined;

    if (updateNotificationDto.device) {
      const deviceObject = await this.deviceService.findEntityById(
        updateNotificationDto.device.id,
      );
      if (!deviceObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            device: 'notExists',
          },
        });
      }
      device = deviceObject;
    }

    const updated = await this.notificationRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      category: updateNotificationDto.category,

      isRead: updateNotificationDto.isRead,

      isDelivered: updateNotificationDto.isDelivered,

      data: updateNotificationDto.data,

      topic: updateNotificationDto.topic,

      message: updateNotificationDto.message,

      title: updateNotificationDto.title,

      device,
    });
    return updated
      ? GroupPlainToInstance(NotificationResponseDto, updated, [RoleEnum.admin])
      : null;
  }

  remove(id: Notification['id']) {
    return this.notificationRepository.remove(id);
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<NotificationResponseDto[]> {
    return this.notificationRepository
      .findManyWithPagination({
        filterOptions,
        sortOptions,
        paginationOptions,
      })
      .then((notifications) =>
        GroupPlainToInstances(NotificationResponseDto, notifications, [
          RoleEnum.admin,
        ]),
      );
  }

  findByDeviceIdWithPagination({
    deviceId,
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    deviceId: string;
    filterOptions?: FilterNotificationDto | null;
    sortOptions?: SortNotificationDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<NotificationResponseDto[]> {
    return this.notificationRepository
      .findByDeviceIdWithPagination({
        deviceId,
        filterOptions,
        sortOptions,
        paginationOptions,
      })
      .then((notifications) =>
        GroupPlainToInstances(NotificationResponseDto, notifications, [
          RoleEnum.admin,
        ]),
      );
  }
  findAllByDeviceId(
    deviceId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationRepository
      .findAllByDeviceId(deviceId, paginationOptions)
      .then((notifications) =>
        GroupPlainToInstances(NotificationResponseDto, notifications, [
          RoleEnum.admin,
        ]),
      );
  }

  findUnreadByDeviceId(
    deviceId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<NotificationResponseDto[]> {
    return this.notificationRepository
      .findUnreadByDeviceId(deviceId, paginationOptions)
      .then((notifications) =>
        GroupPlainToInstances(NotificationResponseDto, notifications, [
          RoleEnum.admin,
        ]),
      );
  }

  async findAllByDeviceIdForMe(
    deviceId: string,
    userId: User['id'],
    paginationOptions: IPaginationOptions,
  ): Promise<NotificationResponseDto[]> {
    await this.requireDeviceForUser(deviceId, userId);
    const notifications = await this.notificationRepository.findAllByDeviceId(
      deviceId,
      paginationOptions,
    );
    return GroupPlainToInstances(NotificationResponseDto, notifications, [
      RoleEnum.user,
    ]);
  }

  async markReadAllDeliveredByDeviceIdForMe(
    deviceId: string,
    userId: User['id'],
  ): Promise<NotificationBulkResultDto> {
    await this.requireDeviceForUser(deviceId, userId);
    const affected =
      await this.notificationRepository.markReadAllDeliveredByDeviceId(
        deviceId,
      );
    return GroupPlainToInstance(NotificationBulkResultDto, { affected }, [
      RoleEnum.user,
    ]);
  }

  async markReadByIdForMe(
    id: Notification['id'],
    userId: User['id'],
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationRepository.findByIdWithDevice(id);
    if (!notification || notification.device?.user?.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          notification: 'notExists',
        },
      });
    }

    const updated = await this.notificationRepository.update(id, {
      isRead: true,
    });
    if (!updated) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          notification: 'notExists',
        },
      });
    }
    return GroupPlainToInstance(NotificationResponseDto, updated, [
      RoleEnum.user,
    ]);
  }

  async markDeliveredByIdForMe(
    id: Notification['id'],
    userId: User['id'],
  ): Promise<NotificationResponseDto> {
    const notification =
      await this.notificationRepository.findByIdWithDevice(id);
    if (!notification || notification.device?.user?.id !== userId) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          notification: 'notExists',
        },
      });
    }

    const updated = await this.notificationRepository.update(id, {
      isDelivered: true,
    });
    if (!updated) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          notification: 'notExists',
        },
      });
    }
    return GroupPlainToInstance(NotificationResponseDto, updated, [
      RoleEnum.user,
    ]);
  }

  private async requireDeviceForUser(
    deviceId: string,
    userId: User['id'],
  ): Promise<Device> {
    const device = await this.deviceService.findEntityById(deviceId);
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
