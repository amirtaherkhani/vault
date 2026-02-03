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
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { ApiOperationRoles } from '../../utils/decorators/swagger.decorator';
import { CmcKeyInfoDto } from './dto/cmc-info.dto';
import {
  RequireEnabled,
  RequireServiceReady,
} from 'src/utils/decorators/service-toggleable.decorators';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import {
  CmcBlockchainStatisticsLatestQueryDto,
  CmcCryptoInfoQueryDto,
  CmcCryptoListingsLatestQueryDto,
  CmcCryptoMapQueryDto,
  CmcCryptoMarketPairsLatestV1QueryDto,
  CmcCryptoOhlcvHistoricalV1QueryDto,
  CmcCryptoOhlcvLatestV1QueryDto,
  CmcCryptoQuotesHistoricalV1QueryDto,
  CmcCryptoQuotesLatestV1QueryDto,
  CmcFearAndGreedHistoricalQueryDto,
  CmcFiatMapQueryDto,
  CmcGlobalMetricsHistoricalQueryDto,
  CmcGlobalMetricsQueryDto,
  CmcPriceConversionV1QueryDto,
  CmcTrendingQueryDto,
} from './dto/cmc-base.query.dto';
import {
  CmcGlobalMetricsQuotesHistoricalDto,
  CmcGlobalMetricsQuotesLatestDto,
} from './dto/cmc-global-metrics.dto';
import { CmcToolsPriceConversionV1Dto } from './dto/cmc-tools.dto';
import { CmcFiatMapDto } from './dto/cmc-fiat.dto';
import { CmcBlockchainStatisticsLatestDto } from './dto/cmc-blockchain.dto';
import { CmcFearAndGreedHistoricalDto } from './dto/cmc-fear-and-greed.dto';
import {
  CmcCryptoInfoV1Dto,
  CmcCryptoListingsLatestV1Dto,
  CmcCryptoMapV1Dto,
  CmcCryptoMarketPairsLatestV1Dto,
  CmcCryptoOhlcvHistoricalV1Dto,
  CmcCryptoOhlcvLatestV1Dto,
  CmcCryptoQuotesHistoricalV1Dto,
  CmcCryptoQuotesLatestV1Dto,
  CmcTrendingGainersLosersV1Dto,
  CmcTrendingLatestV1Dto,
  CmcTrendingMostVisitedV1Dto,
} from './dto/cmc-cryptocurrency.dto';
import { ResponseModel } from '../../common/api-gateway/response/decorators/response-model.decorator';
import { DynamicAuthGuard } from '../../auth/guards/dynamic-auth.guard';

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
  // Key / Plan usage
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get CMC key info (plan/usage)', [RoleEnum.admin])
  @Get('key/info')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcKeyInfoDto })
  getKeyInfo(): Promise<CmcKeyInfoDto> {
    return this.cmc.getKeyInfo();
  }

  // ---------------------------------------------------------------------------
  // Global Metrics
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get latest global metrics', [RoleEnum.admin])
  @Get('global-metrics/quotes/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcGlobalMetricsQuotesLatestDto })
  getGlobalMetricsLatest(
    @Query() query: CmcGlobalMetricsQueryDto,
  ): Promise<CmcGlobalMetricsQuotesLatestDto> {
    return this.cmc.getGlobalMetricsLatest(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get historical global metrics', [RoleEnum.admin])
  @Get('global-metrics/quotes/historical')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcGlobalMetricsQuotesHistoricalDto })
  getGlobalMetricsHistorical(
    @Query() query: CmcGlobalMetricsHistoricalQueryDto,
  ): Promise<CmcGlobalMetricsQuotesHistoricalDto> {
    return this.cmc.getGlobalMetricsHistorical(query);
  }

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Price conversion (v1)', [RoleEnum.admin])
  @Get('tools/price-conversion')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcToolsPriceConversionV1Dto })
  priceConversion(
    @Query() query: CmcPriceConversionV1QueryDto,
  ): Promise<CmcToolsPriceConversionV1Dto> {
    return this.cmc.priceConversionV1(query);
  }

  // ---------------------------------------------------------------------------
  // Fiat
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get fiat map', [RoleEnum.admin])
  @Get('fiat/map')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcFiatMapDto })
  getFiatMap(@Query() query: CmcFiatMapQueryDto): Promise<CmcFiatMapDto> {
    return this.cmc.getFiatMap(query);
  }

  // ---------------------------------------------------------------------------
  // Blockchain
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get blockchain statistics latest', [RoleEnum.admin])
  @Get('blockchain/statistics/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcBlockchainStatisticsLatestDto })
  getBlockchainStatisticsLatest(
    @Query() query: CmcBlockchainStatisticsLatestQueryDto,
  ): Promise<CmcBlockchainStatisticsLatestDto> {
    return this.cmc.getBlockchainStatisticsLatest(query);
  }

  // ---------------------------------------------------------------------------
  // Fear & Greed
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get fear & greed historical', [RoleEnum.admin])
  @Get('fear-and-greed/historical')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcFearAndGreedHistoricalDto })
  getFearAndGreedHistorical(
    @Query() query: CmcFearAndGreedHistoricalQueryDto,
  ): Promise<CmcFearAndGreedHistoricalDto> {
    return this.cmc.getFearAndGreedHistorical(query);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Assets and lists
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Crypto map', [RoleEnum.admin])
  @Get('cryptocurrency/map')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoMapV1Dto })
  getCryptoMap(
    @Query() query: CmcCryptoMapQueryDto,
  ): Promise<CmcCryptoMapV1Dto> {
    return this.cmc.getCryptoMap(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Crypto info', [RoleEnum.admin])
  @Get('cryptocurrency/info')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoInfoV1Dto })
  getCryptoInfo(
    @Query() query: CmcCryptoInfoQueryDto,
  ): Promise<CmcCryptoInfoV1Dto> {
    return this.cmc.getCryptoInfo(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Crypto listings latest', [RoleEnum.admin])
  @Get('cryptocurrency/listings/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoListingsLatestV1Dto })
  getCryptoListingsLatest(
    @Query() query: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV1Dto> {
    return this.cmc.getCryptoListingsLatest(query);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Quotes and OHLCV
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Crypto quotes latest', [RoleEnum.admin])
  @Get('cryptocurrency/quotes/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoQuotesLatestV1Dto })
  getQuotesLatest(
    @Query() query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV1Dto> {
    return this.cmc.getQuotesLatest(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Crypto quotes historical', [RoleEnum.admin])
  @Get('cryptocurrency/quotes/historical')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoQuotesHistoricalV1Dto })
  getQuotesHistorical(
    @Query() query: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV1Dto> {
    return this.cmc.getQuotesHistorical(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('OHLCV latest', [RoleEnum.admin])
  @Get('cryptocurrency/ohlcv/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoOhlcvLatestV1Dto })
  getOhlcvLatest(
    @Query() query: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV1Dto> {
    return this.cmc.getOhlcvLatest(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('OHLCV historical', [RoleEnum.admin])
  @Get('cryptocurrency/ohlcv/historical')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoOhlcvHistoricalV1Dto })
  getOhlcvHistorical(
    @Query() query: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV1Dto> {
    return this.cmc.getOhlcvHistorical(query);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Market pairs
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Market pairs latest', [RoleEnum.admin])
  @Get('cryptocurrency/market-pairs/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcCryptoMarketPairsLatestV1Dto })
  getMarketPairsLatest(
    @Query() query: CmcCryptoMarketPairsLatestV1QueryDto,
  ): Promise<CmcCryptoMarketPairsLatestV1Dto> {
    return this.cmc.getMarketPairsLatest(query);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Trending
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Trending latest', [RoleEnum.admin])
  @Get('cryptocurrency/trending/latest')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcTrendingLatestV1Dto })
  getTrendingLatest(
    @Query() query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingLatestV1Dto> {
    return this.cmc.getTrendingLatest(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Trending most visited', [RoleEnum.admin])
  @Get('cryptocurrency/trending/most-visited')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcTrendingMostVisitedV1Dto })
  getTrendingMostVisited(
    @Query() query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingMostVisitedV1Dto> {
    return this.cmc.getTrendingMostVisited(query);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Trending gainers & losers', [RoleEnum.admin])
  @Get('cryptocurrency/trending/gainers-losers')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CmcTrendingGainersLosersV1Dto })
  getTrendingGainersLosers(
    @Query() query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingGainersLosersV1Dto> {
    return this.cmc.getTrendingGainersLosers(query);
  }
}
