import {
  BadRequestException,
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
import { RequireEnabled, RequireServiceReady } from 'src/utils/decorators/service-toggleable.decorators';
import { BinanceService } from './binance.service';
import { BinancePriceDto, BinancePriceQueryDto } from './dto/binance-price.dto';
import { BinanceHistoryQueryDto, BinanceCandleDto } from './dto/binance-klines.dto';
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
import {
  BinanceSupportedAssetDto,
  BinanceSupportedAssetsQueryDto,
} from './dto/binance-account.dto';
import { BINANCE_PRESET_TO_INTERVAL, BinanceChartPreset } from './types/binance-const.type';
import { normalizeAssetPair } from './binance.helper';

function normalizeSymbolOrThrow(input: string): string {
  try {
    return normalizeAssetPair(input);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid symbol format';
    throw new BadRequestException(message);
  }
}

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
    if (!query?.symbols) {
      throw new BadRequestException('symbols must be provided');
    }
    const rawSymbolList = query.symbols.split(',').map((s) => s.trim());
    if (!rawSymbolList.length) {
      throw new BadRequestException('No symbols provided');
    }
    const live = query.live !== 'false';
    return this.service.getLatestPrices(rawSymbolList, live);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceCandleDto] })
  async getCandles(
    @Query() query: BinanceHistoryQueryDto,
  ): Promise<BinanceCandleDto[]> {
    const rawSymbol = String(query.symbol || '');
    if (!rawSymbol) {
      throw new BadRequestException('symbol must be provided');
    }
    const symbol = normalizeSymbolOrThrow(rawSymbol);
    const interval = query.interval || '1m';
    const limit = query.limit ? Number(query.limit) : 100;
    const live = query.live !== 'false';
    return this.service.getCandlesticks(symbol, interval, limit, live);
  }

  @Get('supported-assets')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceSupportedAssetDto] })
  async getSupportedAssets(
    @Query() query: BinanceSupportedAssetsQueryDto,
  ): Promise<BinanceSupportedAssetDto[]> {
    return this.service.getSupportedAssets(query.quoteAsset);
  }

  @Get('chart/header')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartHeaderDto })
  async getChartHeader(
    @Query() query: BinanceChartHeaderQueryDto,
  ): Promise<BinanceChartHeaderDto> {
    const rawSymbol = String(query.symbol || '');
    const preset = (query.preset || 'today') as BinanceChartPreset;
    if (!rawSymbol) {
      throw new BadRequestException('symbol required');
    }
    const symbol = normalizeSymbolOrThrow(rawSymbol);
    if (!(preset in BINANCE_PRESET_TO_INTERVAL)) {
      throw new BadRequestException(`invalid preset: ${preset}`);
    }
    return this.service.getChartHeader(symbol, preset);
  }

  @Get('chart/series')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesDto })
  async getChartSeries(
    @Query() query: BinanceChartSeriesQueryDto,
  ): Promise<BinanceChartSeriesDto> {
    const rawSymbol = String(query.symbol || '');
    const preset = (query.preset || 'today') as BinanceChartPreset;
    const limit = query.limit ? Number(query.limit) : undefined;
    if (!rawSymbol) {
      throw new BadRequestException('symbol required');
    }
    const symbol = normalizeSymbolOrThrow(rawSymbol);
    if (!(preset in BINANCE_PRESET_TO_INTERVAL)) {
      throw new BadRequestException(`invalid preset: ${preset}`);
    }
    const { points, interval } = await this.service.getSeriesByPreset(
      symbol,
      preset,
      limit,
      true,
    );
    const base = await this.service.getBaselineOpen(symbol, preset);
    const baselineOpen = base.baselineOpen ?? null;

    const lastClose = points.length
      ? Number(points[points.length - 1].close)
      : NaN;
    const priceNow = Number.isFinite(lastClose) ? lastClose : NaN;
    const priceStr = Number.isFinite(priceNow) ? String(priceNow) : null;

    const changePercent =
      baselineOpen && baselineOpen > 0 && Number.isFinite(priceNow)
        ? ((priceNow - baselineOpen) / baselineOpen) * 100
        : null;

    return {
      symbol,
      preset,
      interval,
      baseline: { open: baselineOpen, time: base.baselineTime },
      price: priceStr,
      changePercent,
      points,
    };
  }

  @Get('chart/mid-price')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: [BinanceChartMidPriceDto] })
  async getChartMidPrice(
    @Query() query: BinanceChartMidPriceQueryDto,
  ): Promise<BinanceChartMidPriceDto[]> {
    if (!query.symbols) {
      throw new BadRequestException('symbols required');
    }
    const symbols = query.symbols
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (!symbols.length) {
      throw new BadRequestException('symbols required');
    }
    return this.service.getMidPrices(symbols);
  }

  @Get('chart/series-range')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BinanceChartSeriesRangeDto })
  async getChartSeriesRange(
    @Query() query: BinanceChartSeriesRangeQueryDto,
  ): Promise<BinanceChartSeriesRangeDto> {
    const rawSymbol = String(query.symbol || '');
    const preset = (query.preset || 'today') as BinanceChartPreset;
    const startTime = query.startTime ? Number(query.startTime) : undefined;
    const endTime = query.endTime ? Number(query.endTime) : undefined;
    const limit = query.limit ? Number(query.limit) : undefined;

    if (!rawSymbol) {
      throw new BadRequestException('symbol required');
    }
    const symbol = normalizeSymbolOrThrow(rawSymbol);
    if (!(preset in BINANCE_PRESET_TO_INTERVAL)) {
      throw new BadRequestException(`invalid preset: ${preset}`);
    }

    const { points, interval } = await this.service.getSeriesByPresetRange(
      symbol,
      preset,
      { startTime, endTime, limit },
    );

    return {
      symbol,
      preset,
      interval,
      points,
      range: { startTime, endTime },
    };
  }
}
