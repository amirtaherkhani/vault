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
import { SleevesTransactionsService } from './sleeves-transactions.service';
import { CreateSleevesTransactionDto } from './dto/create-sleeves-transaction.dto';
import { UpdateSleevesTransactionDto } from './dto/update-sleeves-transaction.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { SleevesTransaction } from './domain/sleeves-transaction';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllSleevesTransactionsDto } from './dto/find-all-sleeves-transactions.dto';
import { DisabledEndpoint } from '../utils/decorators/disabled-endpoint.decorator';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Sleeves-Transactions')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard)
@Controller({
  path: 'sleeves-transactions',
  version: '1',
})
export class SleevesTransactionsController {
  constructor(
    private readonly sleevesTransactionsService: SleevesTransactionsService,
  ) {}

  @Post()
  @ApiCreatedResponse({
    type: SleevesTransaction,
  })
  @DisabledEndpoint({ markDeprecated: true })
  create(@Body() createSleevesTransactionDto: CreateSleevesTransactionDto) {
    return this.sleevesTransactionsService.create(createSleevesTransactionDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(SleevesTransaction),
  })
  async findAll(
    @Query() query: FindAllSleevesTransactionsDto,
  ): Promise<InfinityPaginationResponseDto<SleevesTransaction>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.sleevesTransactionsService.findAllWithPagination({
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
    type: SleevesTransaction,
  })
  findById(@Param('id') id: string) {
    return this.sleevesTransactionsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: SleevesTransaction,
  })
  @DisabledEndpoint({ markDeprecated: true })
  update(
    @Param('id') id: string,
    @Body() updateSleevesTransactionDto: UpdateSleevesTransactionDto,
  ) {
    return this.sleevesTransactionsService.update(
      id,
      updateSleevesTransactionDto,
    );
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.sleevesTransactionsService.remove(id);
  }
}
