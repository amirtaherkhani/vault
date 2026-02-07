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
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { CreateDeviceUserDto } from './dto/create-device.dto';
import {
  UpdateDeviceDto,
  UpdateDeviceStatusDto,
  UpdateDeviceTokenDto,
} from './dto/update-device.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import {
  FindAllDevicesDto,
  FindAllDevicesUserDto,
} from './dto/find-all-devices.dto';
import { TypeMessage } from '../utils/types/message.type';
import {
  DeviceAdminResponseDto,
  DeviceUserResponseDto,
} from './dto/device-response.dto';
import { QueryDeviceDto } from './dto/query-device.dto';
import { ApiOperationRoles } from '../utils/decorators/swagger.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'devices',
  version: '1',
})
export class DevicesController {
  passphrasesService: any;
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperationRoles('Create device', [RoleEnum.admin])
  @ApiCreatedResponse({
    type: DeviceAdminResponseDto,
  })
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @ApiOperationRoles('List devices with pagination', [RoleEnum.admin])
  @ApiOkResponse({
    type: InfinityPaginationResponse(DeviceAdminResponseDto),
  })
  async findAll(
    @Query() query: FindAllDevicesDto,
  ): Promise<InfinityPaginationResponseDto<DeviceAdminResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.devicesService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiOperationRoles('Get device by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: DeviceAdminResponseDto,
  })
  findById(@Param('id') id: string) {
    return this.devicesService.findById(id);
  }

  @Patch(':id')
  @ApiOperationRoles('Update device by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: DeviceAdminResponseDto,
  })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  @ApiOperationRoles('Delete device by ID', [RoleEnum.admin])
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }

  @Post('me')
  @ApiOperationRoles('Create device for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiCreatedResponse({
    type: DeviceUserResponseDto,
  })
  async createByUser(
    @Request() request,
    @Body() createDeviceUserDto: CreateDeviceUserDto,
  ) {
    return this.devicesService.createByUser(createDeviceUserDto, request.user);
  }

  @Patch('me/:deviceId/token')
  @ApiOperationRoles('Update device token for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({ type: DeviceUserResponseDto })
  @HttpCode(HttpStatus.OK)
  updateDeviceTokenByMe(
    @Request() request,
    @Param('deviceId') deviceId: string,
    @Body() body: UpdateDeviceTokenDto,
  ) {
    return this.devicesService.updateDeviceTokenByMe(
      deviceId,
      body.deviceToken,
      request.user,
    );
  }

  @Patch('me/:deviceId/status')
  @ApiOperationRoles('Update device active status for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiParam({ name: 'deviceId', type: String, required: true })
  @ApiOkResponse({ type: DeviceUserResponseDto })
  @HttpCode(HttpStatus.OK)
  updateDeviceStatusByMe(
    @Request() request,
    @Param('deviceId') deviceId: string,
    @Body() body: UpdateDeviceStatusDto,
  ) {
    return this.devicesService.updateDeviceActiveStatusByMe(
      deviceId,
      body.isActive,
      request.user,
    );
  }

  @Get('me')
  @ApiOperationRoles('Get devices for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    type: DeviceUserResponseDto,
    description: 'Successfully retrieved devices for the user',
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: 'No Devices found for the user',
    schema: {
      example: {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          devices: TypeMessage.getMessageByStatus(
            HttpStatus.UNPROCESSABLE_ENTITY,
          ),
        },
      },
    },
  })
  @ApiOkResponse({ type: DeviceUserResponseDto, isArray: true })
  async findAllByMe(@Request() request): Promise<DeviceUserResponseDto[]> {
    return this.devicesService.findByme(request.user);
  }

  @Get('me/actives')
  @ApiOperationRoles('Get active devices for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    type: DeviceUserResponseDto,
    description: 'Successfully retrieved active devices for the user',
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  async findActivesByMe(@Request() request): Promise<DeviceUserResponseDto[]> {
    return this.devicesService.findActiveByMe(request.user);
  }

  @Get('user/:userId')
  @ApiOperationRoles('Get devices by user ID', [RoleEnum.admin])
  @ApiParam({
    name: 'userId',
    type: Number,
    description: 'The numeric ID of the user',
    required: true,
    example: 1,
  })
  @ApiOkResponse({
    type: DeviceAdminResponseDto,
    description: 'Successfully retrieved devices for the user',
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Invalid user ID format',
    schema: {
      example: {
        status: HttpStatus.BAD_REQUEST,
        errors: {
          userId: 'must be a positive number',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'No devices found for the user',
    schema: {
      example: {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          devices: TypeMessage.getMessageByStatus(
            HttpStatus.UNPROCESSABLE_ENTITY,
          ),
        },
      },
    },
  })
  async findAllByUserId(
    @Param() params: FindAllDevicesUserDto,
  ): Promise<DeviceAdminResponseDto[]> {
    return this.devicesService.findByUserId(params.userId);
  }

  @Get('search')
  @ApiOperationRoles('Filter devices', [RoleEnum.admin])
  @ApiOkResponse({
    type: InfinityPaginationResponse(DeviceAdminResponseDto),
    description: 'Successfully retrieved filtered device list',
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
    description: 'No devices matched the filter criteria',
    schema: {
      example: {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          devices: TypeMessage.getMessageByStatus(
            HttpStatus.UNPROCESSABLE_ENTITY,
          ),
        },
      },
    },
  })
  async findMany(
    @Query() query: QueryDeviceDto,
  ): Promise<InfinityPaginationResponseDto<DeviceAdminResponseDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) limit = 50;

    return infinityPagination(
      await this.devicesService.findManyWithPagination({
        filterOptions: query.filters,
        sortOptions: query.sort,
        paginationOptions: { page, limit },
      }),
      { page, limit },
    );
  }
}
