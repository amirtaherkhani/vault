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
import { AssetRegistriesService } from './asset-registries.service';
import { CreateAssetRegistryDto } from './dto/create-asset-registry.dto';
import { UpdateAssetRegistryDto } from './dto/update-asset-registry.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AssetRegistry } from './domain/asset-registry';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllAssetRegistriesDto } from './dto/find-all-asset-registries.dto';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Asset-Registry')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard)
@Roles(RoleEnum.admin)
@Controller({
  path: 'asset-registries',
  version: '1',
})
export class AssetRegistriesController {
  constructor(
    private readonly assetRegistriesService: AssetRegistriesService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: AssetRegistry,
  })
  create(@Body() createAssetRegistryDto: CreateAssetRegistryDto) {
    return this.assetRegistriesService.create(createAssetRegistryDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(AssetRegistry),
  })
  async findAll(
    @Query() query: FindAllAssetRegistriesDto,
  ): Promise<InfinityPaginationResponseDto<AssetRegistry>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.assetRegistriesService.findAllWithPagination({
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
    type: AssetRegistry,
  })
  findById(@Param('id') id: string) {
    return this.assetRegistriesService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: AssetRegistry,
  })
  update(
    @Param('id') id: string,
    @Body() updateAssetRegistryDto: UpdateAssetRegistryDto,
  ) {
    return this.assetRegistriesService.update(id, updateAssetRegistryDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.assetRegistriesService.remove(id);
  }
  @Get('providers/:providerName')
  @ApiParam({
    name: 'providerName',
    type: AssetRegistry['providerName'],
    required: true,
  })
  @ApiOkResponse({ type: AssetRegistry, isArray: true })
  findByProviderName(
    @Param('providerName') providerName: AssetRegistry['providerName'],
  ) {
    return this.assetRegistriesService.findByProviderName(providerName);
  }
}
