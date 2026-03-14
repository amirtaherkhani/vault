import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles/roles.guard';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import {
  RequireEnabled,
  RequireServiceReady,
} from 'src/utils/decorators/service-toggleable.decorators';
import { BinanceService } from './binance.service';
import { BinancePriceDto, BinancePriceQueryDto } from './dto/binance-price.dto';
import {
  BinanceHistoryQueryDto,
  BinanceCandleDto,
} from './dto/binance-klines.dto';
import {
  BinanceChartHeaderDto,
  BinanceChartHeaderQueryDto,
  BinanceChartMidPriceDto,
  BinanceChartMidPriceQueryDto,
  BinanceChartSeriesDto,
  BinanceChartSeriesQueryDto,
  BinanceChartSeriesRangeDto,
  BinanceChartSeriesRangeQueryDto,
} from './dto/binance-chart.dto';
import { BinanceHealthDto } from './dto/binance-health.dto';
import {
  BinanceSupportedAssetDto,
  BinanceSupportedAssetsQueryDto,
} from './dto/binance-account.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard, EnableGuard)
@RequireEnabled('binance.enable')
@RequireServiceReady(BinanceService)
@ApiTags('Binance')
@Controller({ path: 'binance', version: '1' })
export class BinanceController {
  constructor(private readonly service: BinanceService) {}

  @Get('price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinancePriceDto] })
  async getLatestPrice(
    @Query() query: BinancePriceQueryDto,
  ): Promise<BinancePriceDto[]> {
    return this.service.getLatestPriceDtos(query);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceCandleDto] })
  async getCandles(
    @Query() query: BinanceHistoryQueryDto,
  ): Promise<BinanceCandleDto[]> {
    return this.service.getHistoryDtos(query);
  }

  @Get('supported-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceSupportedAssetDto] })
  async getSupportedAssets(
    @Query() query: BinanceSupportedAssetsQueryDto,
  ): Promise<BinanceSupportedAssetDto[]> {
    return this.service.getSupportedAssetsDtos(query);
  }

  @Get('chart/header')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartHeaderDto })
  async getChartHeader(
    @Query() query: BinanceChartHeaderQueryDto,
  ): Promise<BinanceChartHeaderDto> {
    return this.service.getChartHeaderDto(query);
  }

  @Get('chart/series')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesDto })
  async getChartSeries(
    @Query() query: BinanceChartSeriesQueryDto,
  ): Promise<BinanceChartSeriesDto> {
    return this.service.getChartSeriesDto(query);
  }

  @Get('chart/mid-price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceChartMidPriceDto] })
  async getChartMidPrice(
    @Query() query: BinanceChartMidPriceQueryDto,
  ): Promise<BinanceChartMidPriceDto[]> {
    return this.service.getChartMidPriceDtos(query);
  }

  @Get('chart/series-range')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesRangeDto })
  async getChartSeriesRange(
    @Query() query: BinanceChartSeriesRangeQueryDto,
  ): Promise<BinanceChartSeriesRangeDto> {
    return this.service.getChartSeriesRangeDto(query);
  }

  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: BinanceHealthDto,
    description: 'Binance provider health',
  })
  async health(): Promise<BinanceHealthDto> {
    return this.service.healthCheck();
  }
}
