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
  HttpCode,
  SerializeOptions,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './domain/user';
import { UsersService } from './users.service';
import { RolesGuard } from '../roles/roles.guard';
import { infinityPagination } from '../utils/infinity-pagination';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../utils/transformers/class.transformer';
import { SerializeGroups } from '../utils/transformers/enum.transformer';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(DynamicAuthGuard, RolesGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({
    type: User,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProfileDto: CreateUserDto): Promise<User> {
    return GroupPlainToInstance(
      User,
      await this.usersService.create(createProfileDto),
      [RoleEnum.admin],
    );
  }

  @ApiOkResponse({
    type: InfinityPaginationResponse(User),
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<InfinityPaginationResponseDto<User>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const users = await this.usersService.findManyWithPagination({
      filterOptions: query?.filters,
      sortOptions: query?.sort,
      paginationOptions: {
        page,
        limit,
      },
    });
    const serialized = GroupPlainToInstances(User, users, [RoleEnum.admin]);
    return infinityPagination(serialized, { page, limit });
  }

  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  async findOne(@Param('id') id: User['id']): Promise<NullableType<User>> {
    return await this.usersService
      .findById(id)
      .then((result) =>
        result ? GroupPlainToInstance(User, result, [RoleEnum.admin]) : null,
      );
  }

  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  async update(
    @Param('id') id: User['id'],
    @Body() updateProfileDto: UpdateUserDto,
  ): Promise<User | null> {
    return await this.usersService
      .update(id, updateProfileDto)
      .then((result) =>
        result ? GroupPlainToInstance(User, result, [RoleEnum.admin]) : null,
      );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: User['id']): Promise<void> {
    return this.usersService.remove(id);
  }
}
