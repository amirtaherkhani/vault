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
import { StrigaCardsService } from './striga-cards.service';
import { CreateStrigaCardDto } from './dto/create-striga-card.dto';
import { UpdateStrigaCardDto } from './dto/update-striga-card.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StrigaCard } from './domain/striga-card';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../../utils/infinity-pagination';
import { FindAllStrigaCardsDto } from './dto/find-all-striga-cards.dto';

@ApiTags('Strigacards')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'striga-cards',
  version: '1',
})
export class StrigaCardsController {
  constructor(private readonly strigaCardsService: StrigaCardsService) {}

  @Post()
  @ApiCreatedResponse({
    type: StrigaCard,
  })
  create(@Body() createStrigaCardDto: CreateStrigaCardDto) {
    return this.strigaCardsService.create(createStrigaCardDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(StrigaCard),
  })
  async findAll(
    @Query() query: FindAllStrigaCardsDto,
  ): Promise<InfinityPaginationResponseDto<StrigaCard>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.strigaCardsService.findAllWithPagination({
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
    type: StrigaCard,
  })
  findById(@Param('id') id: string) {
    return this.strigaCardsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: StrigaCard,
  })
  update(
    @Param('id') id: string,
    @Body() updateStrigaCardDto: UpdateStrigaCardDto,
  ) {
    return this.strigaCardsService.update(id, updateStrigaCardDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.strigaCardsService.remove(id);
  }
}
