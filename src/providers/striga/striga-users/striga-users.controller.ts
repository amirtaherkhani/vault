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
} from '@nestjs/common';
import { StrigaUsersService } from './striga-users.service';
import { CreateStrigaUserDto } from './dto/create-striga-user.dto';
import { UpdateStrigaUserDto } from './dto/update-striga-user.dto';
import {
  ApiExcludeController,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StrigaUser } from './domain/striga-user';
import { AuthGuard } from '@nestjs/passport';
import { EnableGuard } from '../../../common/guards/service-enabled.guard';
import { RequireEnabled } from '../../../utils/decorators/service-toggleable.decorators';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../../utils/infinity-pagination';
import { FindAllStrigaUsersDto } from './dto/find-all-striga-users.dto';

@ApiExcludeController()
@RequireEnabled(['striga.enable', 'striga.usersEndpointsEnable'])
@ApiTags('Striga Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), EnableGuard)
@Controller({
  path: 'striga-users',
  version: '1',
})
export class StrigaUsersController {
  constructor(private readonly strigaUsersService: StrigaUsersService) {}

  @Post()
  @ApiCreatedResponse({
    type: StrigaUser,
  })
  create(@Body() createStrigaUserDto: CreateStrigaUserDto) {
    return this.strigaUsersService.create(createStrigaUserDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(StrigaUser),
  })
  async findAll(
    @Query() query: FindAllStrigaUsersDto,
  ): Promise<InfinityPaginationResponseDto<StrigaUser>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.strigaUsersService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: StrigaUser,
  })
  findById(@Param('id') id: string) {
    return this.strigaUsersService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: StrigaUser,
  })
  update(
    @Param('id') id: string,
    @Body() updateStrigaUserDto: UpdateStrigaUserDto,
  ) {
    return this.strigaUsersService.update(id, updateStrigaUserDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.strigaUsersService.remove(id);
  }
}
