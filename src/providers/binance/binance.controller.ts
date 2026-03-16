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
  async findTickerPrices(
    @Query() query: BinancePriceQueryDto,
  ): Promise<BinancePriceDto[]> {
    return this.service.findTickerPrices(query);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceCandleDto] })
  async findKlines(
    @Query() query: BinanceHistoryQueryDto,
  ): Promise<BinanceCandleDto[]> {
    return this.service.findKlines(query);
  }

  @Get('supported-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceSupportedAssetDto] })
  async findSupportedAssets(
    @Query() query: BinanceSupportedAssetsQueryDto,
  ): Promise<BinanceSupportedAssetDto[]> {
    return this.service.findSupportedAssets(query);
  }

  @Get('chart/header')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartHeaderDto })
  async findChartHeader(
    @Query() query: BinanceChartHeaderQueryDto,
  ): Promise<BinanceChartHeaderDto> {
    return this.service.findChartHeader(query);
  }

  @Get('chart/series')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesDto })
  async findChartSeries(
    @Query() query: BinanceChartSeriesQueryDto,
  ): Promise<BinanceChartSeriesDto> {
    return this.service.findChartSeries(query);
  }

  @Get('chart/mid-price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceChartMidPriceDto] })
  async findChartMidPrice(
    @Query() query: BinanceChartMidPriceQueryDto,
  ): Promise<BinanceChartMidPriceDto[]> {
    return this.service.findChartMidPrices(query);
  }

  @Get('chart/series-range')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesRangeDto })
  async findChartSeriesRange(
    @Query() query: BinanceChartSeriesRangeQueryDto,
  ): Promise<BinanceChartSeriesRangeDto> {
    return this.service.findChartSeriesRange(query);
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
