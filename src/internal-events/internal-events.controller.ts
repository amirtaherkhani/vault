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
import { InternalEventsService } from './internal-events.service';
import { CreateInternalEventDto } from './dto/create-internal-event.dto';
import { UpdateInternalEventDto } from './dto/update-internal-event.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { InternalEvent } from './domain/internal-event';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllInternalEventsDto } from './dto/find-all-internal-events.dto';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Internal-events')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard)
@Controller({
  path: 'internal-events',
  version: '1',
})
export class InternalEventsController {
  constructor(private readonly internalEventsService: InternalEventsService) {}

  @Post()
  @ApiCreatedResponse({
    type: InternalEvent,
  })
  create(@Body() createInternalEventDto: CreateInternalEventDto) {
    return this.internalEventsService.create(createInternalEventDto);
  }

  @Get()
  @ApiOkResponse({
    type: InfinityPaginationResponse(InternalEvent),
  })
  async findAll(
    @Query() query: FindAllInternalEventsDto,
  ): Promise<InfinityPaginationResponseDto<InternalEvent>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.internalEventsService.findAllWithPagination({
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
    type: InternalEvent,
  })
  findById(@Param('id') id: string) {
    return this.internalEventsService.findById(id);
  }

  @Patch(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: InternalEvent,
  })
  update(
    @Param('id') id: string,
    @Body() updateInternalEventDto: UpdateInternalEventDto,
  ) {
    return this.internalEventsService.update(id, updateInternalEventDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string) {
    return this.internalEventsService.remove(id);
  }
}
