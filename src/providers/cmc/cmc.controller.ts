import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CmcService } from './cmc.service';
import { RolesGuard } from '../../roles/roles.guard';
import {
  RequireEnabled,
  RequireServiceReady,
} from 'src/utils/decorators/service-toggleable.decorators';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { DynamicAuthGuard } from '../../auth/guards/dynamic-auth.guard';
import { ResponseModel } from '../../common/api-gateway/response/decorators/response-model.decorator';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { ApiOperationRoles } from '../../utils/decorators/swagger.decorator';
import {
  PricesQueryDto,
  PricesResponseDto,
  MetadataQueryDto,
  MetadataResponseDto,
  GlobalStatsDto,
  HistoryQueryDto,
  HistoryResponseDto,
  HistoryBatchedQueryDto,
  HistoryBatchedResponseDto,
  QuotesHistoricalV2QueryDto,
  QuotesHistoricalV2ResponseDto,
} from './dto/cmc-client.dto';
import { CmcHealthDto } from './dto/cmc-health.dto';
import { CmcKeyInfoDto } from './dto/cmc-info.dto';

@ResponseModel('CMC')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('cmc.enable') // config-based toggle
@RequireServiceReady(CmcService) // service readiness check
@ApiTags('CoinMarketCap')
@Controller({ path: 'cmc', version: '1' })
export class CmcController {
  constructor(private readonly cmc: CmcService) {}

  // ---------------------------------------------------------------------------
  // Legacy-compatible endpoints (stubs)
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get prices', [RoleEnum.admin, RoleEnum.user])
  @Get('prices')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: PricesResponseDto })
  getPrices(@Query() query: PricesQueryDto): Promise<PricesResponseDto> {
    return this.cmc.getPrices(query);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get metadata', [RoleEnum.admin, RoleEnum.user])
  @Get('metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: MetadataResponseDto })
  getMetadata(@Query() query: MetadataQueryDto): Promise<MetadataResponseDto> {
    return this.cmc.getMetadata(query);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get global stats', [RoleEnum.admin, RoleEnum.user])
  @Get('global')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: GlobalStatsDto })
  getGlobal(): Promise<GlobalStatsDto> {
    return this.cmc.getGlobalStats();
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get history', [RoleEnum.admin, RoleEnum.user])
  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  getHistory(@Query() query: HistoryQueryDto): Promise<HistoryResponseDto> {
    return this.cmc.getHistory(query);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get history batched', [RoleEnum.admin, RoleEnum.user])
  @Get('history/batched')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Array })
  getHistoryBatched(
    @Query() query: HistoryBatchedQueryDto,
  ): Promise<HistoryBatchedResponseDto> {
    return this.cmc.getHistoryBatched(query);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get quotes historical v2', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('quotes/historical')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Object })
  getQuotesHistoricalV2(
    @Query() query: QuotesHistoricalV2QueryDto,
  ): Promise<QuotesHistoricalV2ResponseDto> {
    return this.cmc.getQuotesHistoricalV2(query);
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('CMC health check', [RoleEnum.admin])
  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcHealthDto })
  health(): Promise<CmcHealthDto> {
    return this.cmc.health();
  }
}
