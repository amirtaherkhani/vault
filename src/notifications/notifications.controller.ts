import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpStatus,
  Request,
  HttpCode,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllNotificationsDto } from './dto/find-all-notifications.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { RequestWithUser } from '../utils/types/object.type';
import { ApiOperationRoles } from '../utils/decorators/swagger.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationBulkResultDto } from './dto/notification-bulk-result.dto';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard)
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperationRoles('Create notification', [RoleEnum.admin])
  @ApiCreatedResponse({
    type: NotificationResponseDto,
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperationRoles('List notifications with pagination', [RoleEnum.admin])
  @ApiOkResponse({
    type: InfinityPaginationResponse(NotificationResponseDto),
  })
  async findAll(
    @Query() query: FindAllNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<NotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.notificationsService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get('me/device/:deviceId')
  @ApiOperationRoles('Get notifications for current user and device', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({
    type: InfinityPaginationResponse(NotificationResponseDto),
    description: 'All notifications for the current user and device',
  })
  async findAllByDeviceIdForMe(
    @Request() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query() query: FindAllNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<NotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    return infinityPagination(
      await this.notificationsService.findAllByDeviceIdForMe(
        deviceId,
        req.user.id,
        { page, limit },
      ),
      { page, limit },
    );
  }

  @Patch('me/device/:deviceId/read')
  @ApiOperationRoles('Mark delivered notifications as read for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({
    type: NotificationBulkResultDto,
    description: 'Marked all delivered notifications as read for this device',
  })
  @HttpCode(HttpStatus.OK)
  markReadAllDeliveredByDeviceIdForMe(
    @Request() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.notificationsService.markReadAllDeliveredByDeviceIdForMe(
      deviceId,
      req.user.id,
    );
  }

  @Patch('me/:id/read')
  @ApiOperationRoles('Mark notification as read for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  markReadByIdForMe(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.notificationsService.markReadByIdForMe(id, req.user.id);
  }

  @Patch('me/:id/delivered')
  @ApiOperationRoles('Mark notification as delivered for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  markDeliveredByIdForMe(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markDeliveredByIdForMe(id, req.user.id);
  }
  @Get(':id')
  @ApiOperationRoles('Get notification by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
  })
  findById(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperationRoles('Update notification by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: NotificationResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @ApiOperationRoles('Delete notification by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
  @Get('search')
  @ApiOperationRoles('Filter notifications', [RoleEnum.admin])
  @ApiOkResponse({
    type: InfinityPaginationResponse(NotificationResponseDto),
    description: 'Successfully retrieved filtered notification list',
  })
  @ApiBadRequestResponse({
    description: 'Invalid filter or sort options',
    schema: {
      example: {
        status: HttpStatus.BAD_REQUEST,
        errors: {
          filters: 'Invalid filter format',
          sort: 'Sort key is not allowed',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No notifications matched the filter criteria',
    schema: {
      example: {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          notifications: 'No matching notifications found',
        },
      },
    },
  })
  async findMany(
    @Query() query: QueryNotificationDto,
  ): Promise<InfinityPaginationResponseDto<NotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    return infinityPagination(
      await this.notificationsService.findManyWithPagination({
        filterOptions: query.filters,
        sortOptions: query.sort,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }
  @Get('device/:deviceId')
  @ApiOperationRoles('Get notifications by device ID', [RoleEnum.admin])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({
    type: InfinityPaginationResponse(NotificationResponseDto),
    description: 'All notifications for a device',
  })
  async findAllByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query() query: FindAllNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<NotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    return infinityPagination(
      await this.notificationsService.findAllByDeviceId(deviceId, {
        page,
        limit,
      }),
      { page, limit },
    );
  }

  @Get('device/:deviceId/unread')
  @ApiOperationRoles('Get unread notifications by device ID', [RoleEnum.admin])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({
    type: InfinityPaginationResponse(NotificationResponseDto),
    description: 'All unread notifications for a device',
  })
  async findUnreadByDeviceId(
    @Param('deviceId') deviceId: string,
    @Query() query: FindAllNotificationsDto,
  ): Promise<InfinityPaginationResponseDto<NotificationResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    return infinityPagination(
      await this.notificationsService.findUnreadByDeviceId(deviceId, {
        page,
        limit,
      }),
      { page, limit },
    );
  }
}
