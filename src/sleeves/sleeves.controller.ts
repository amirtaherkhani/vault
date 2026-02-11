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
} from '@nestjs/common';
import { SleevesService } from './sleeves.service';
import { CreateSleevesDto } from './dto/create-sleeves.dto';
import { UpdateSleevesDto } from './dto/update-sleeves.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Sleeves } from './domain/sleeves';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllSleevesDto } from './dto/find-all-sleeves.dto';
import { DisabledEndpoint } from '../utils/decorators/disabled-endpoint.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { ApiOperationRoles } from 'src/utils/decorators/swagger.decorator';
import { SleevesDto } from './dto/sleeves.dto';
import { FilterSleevesDto } from './dto/filter-sleeves.dto';
import { Roles } from 'src/roles/roles.decorator';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Sleeves')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard)
@Roles(RoleEnum.admin)
@Controller({
  path: 'sleeves',
  version: '1',
})
export class SleevesController {
  addressBooksService: any;
  constructor(private readonly sleevesService: SleevesService) {}

  @Post()
  @ApiCreatedResponse({
    type: Sleeves,
  })
  @DisabledEndpoint({ markDeprecated: true })
  create(@Body() createSleevesDto: CreateSleevesDto) {
    return this.sleevesService.create(createSleevesDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(Sleeves),
  })
  async findAll(
    @Query() query: FindAllSleevesDto,
  ): Promise<InfinityPaginationResponseDto<Sleeves>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.sleevesService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @ApiOperationRoles('Filter sleeves', [RoleEnum.admin])
  @Get('/filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SleevesDto, isArray: true })
  filter(@Query() query: FilterSleevesDto) {
    return this.sleevesService.filter({
      contractName: query.contractName,
      tag: query.tag,
      name: query.name,
    });
  }

  @Get('assets/:assetId')
  @ApiParam({
    name: 'assetId',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: SleevesDto, isArray: true })
  findByAsset(@Param('assetId') assetId: string) {
    return this.sleevesService.findByAsset(assetId);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Sleeves,
  })
  findById(@Param('id') id: string) {
    return this.sleevesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: Sleeves,
  })
  @DisabledEndpoint({ markDeprecated: true })
  update(@Param('id') id: string, @Body() updateSleevesDto: UpdateSleevesDto) {
    return this.sleevesService.update(id, updateSleevesDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.sleevesService.remove(id);
  }
}
