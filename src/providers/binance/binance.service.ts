import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { BaseToggleableService } from '../../common/base/base-toggleable.service';
import {
  BINANCE_MAX_KLINE_LIMIT,
  BINANCE_PRESET_TO_INTERVAL,
  BINANCE_PRESET_WINDOW_MS,
  BINANCE_VALID_INTERVALS,
  BinanceChartPreset,
  BinanceKlineInterval,
} from './types/binance-const.type';
import { calendarAnchorStart, intervalMs } from './binance.helper';
import {
  normalizeSymbolsOrThrow,
  parseSymbolCsv,
  sliceCandles,
} from './helper/binance-service.helper';
import { BinanceCandleDto } from './dto/binance-klines.dto';
import { BinanceSupportedAssetDto } from './dto/binance-account.dto';
import { BinanceBaseService } from './services/binance-base.service';
import { BinanceMapper } from './infrastructure/persistence/relational/mappers/binance.mapper';
import {
  BinanceChartHeaderDto,
  BinanceChartMidPriceDto,
  BinanceChartMidPriceQueryDto,
  BinanceChartSeriesDto,
  BinanceChartSeriesQueryDto,
  BinanceChartSeriesRangeDto,
  BinanceChartSeriesRangeQueryDto,
  BinanceChartHeaderQueryDto,
} from './dto/binance-chart.dto';
import { BinancePriceDto, BinancePriceQueryDto } from './dto/binance-price.dto';
import { BinanceHistoryQueryDto } from './dto/binance-klines.dto';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../../utils/transformers/class.transformer';
import { BinanceSupportedAssetsQueryDto } from './dto/binance-account.dto';
import { BinanceHealthDto } from './dto/binance-health.dto';
import { computeBaselineStats } from './helper/binance-service.helper';
import { ConfigGet } from '../../config/config.decorator';
import {
  BINANCE_DEFAULT_QUOTE_ASSET,
  BINANCE_ENABLE,
} from './types/binance-const.type';

@Injectable()
export class BinanceService
  extends BaseToggleableService
  implements OnModuleInit
{
  @ConfigGet('binance.enable', {
    inferEnvVar: true,
    defaultValue: BINANCE_ENABLE,
  })
  private readonly enableFlag!: boolean;

  @ConfigGet('binance.defaultQuoteAsset', {
    inferEnvVar: true,
    defaultValue: BINANCE_DEFAULT_QUOTE_ASSET,
  })
  private readonly defaultQuoteAsset!: string;

  static readonly displayName = 'Binance';

  constructor(
    private readonly baseService: BinanceBaseService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super(
      BinanceService.name,
      configService.get('binance.enable', { infer: true }) ?? false,
      {
        id: 'binance',
        displayName: BinanceService.displayName,
        configKey: 'binance.enable',
        envKey: 'BINANCE_ENABLE',
        description: 'Binance spot market data provider.',
        tags: ['provider', 'crypto', 'market-data'],
      },
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('Binance service is DISABLED. Skipping initialization.');
      return;
    }

    if (!this.baseService.isReady()) {
      this.logger.warn('Binance API client is not ready.');
      return;
    }

    const ok = await this.checkConnection();
    if (ok) {
      this.logger.log('Binance service is READY (REST reachable).');
    } else {
      this.logger.warn('Binance connectivity check failed.');
    }
  }

  isReady(): boolean {
    return this.isEnabled && this.baseService.isReady();
  }

  // ---------------------------------------------------------------------------
  // Controller-facing helpers (DTO + transformation)
  // ---------------------------------------------------------------------------
  async findTickerPrices(
    query: BinancePriceQueryDto,
  ): Promise<BinancePriceDto[]> {
    const symbols = parseSymbolCsv(query.symbols);
    const live = query.live ?? true;
    const result = await this.findTickerPricesFromProvider(symbols, live);
    return GroupPlainToInstances(BinancePriceDto, result);
  }

  async findKlines(query: BinanceHistoryQueryDto): Promise<BinanceCandleDto[]> {
    const interval = (query.interval as BinanceKlineInterval) ?? '1m';
    const limit = query.limit ?? 100;
    const live = query.live ?? true;
    const points = await this.findKlinesFromProvider(
      query.symbol,
      interval,
      limit,
      live,
    );
    return GroupPlainToInstances(BinanceCandleDto, points);
  }

  async findSupportedAssets(
    query: BinanceSupportedAssetsQueryDto,
  ): Promise<BinanceSupportedAssetDto[]> {
    const assets = await this.findSupportedAssetsFromProvider(query.quoteAsset);
    return GroupPlainToInstances(BinanceSupportedAssetDto, assets);
  }

  async findChartHeader(
    query: BinanceChartHeaderQueryDto,
  ): Promise<BinanceChartHeaderDto> {
    const preset = (query.preset || 'today') as BinanceChartPreset;
    const dto = await this.buildChartHeader(
      query.symbol,
      preset,
      query.timeZone,
    );
    return GroupPlainToInstance(BinanceChartHeaderDto, dto);
  }

  async findChartSeries(
    query: BinanceChartSeriesQueryDto,
  ): Promise<BinanceChartSeriesDto> {
    const preset = (query.preset || 'today') as BinanceChartPreset;
    const limit = query.limit;
    const series = await this.buildChartSeries(
      query.symbol,
      preset,
      limit,
      query.timeZone,
    );
    return GroupPlainToInstance(BinanceChartSeriesDto, series);
  }

  async findChartMidPrices(
    query: BinanceChartMidPriceQueryDto,
  ): Promise<BinanceChartMidPriceDto[]> {
    const symbols = parseSymbolCsv(query.symbols);
    const mids = await this.findMidPricesFromProvider(symbols);
    return GroupPlainToInstances(BinanceChartMidPriceDto, mids);
  }

  async findChartSeriesRange(
    query: BinanceChartSeriesRangeQueryDto,
  ): Promise<BinanceChartSeriesRangeDto> {
    const preset = (query.preset || 'today') as BinanceChartPreset;
    const limit = query.limit;
    const startTime = query.startTime;
    const endTime = query.endTime;
    const series = await this.buildChartSeriesRange(
      query.symbol,
      preset,
      {
        startTime,
        endTime,
        limit,
      },
      query.timeZone,
    );
    return GroupPlainToInstance(BinanceChartSeriesRangeDto, series);
  }

  async healthCheck(): Promise<BinanceHealthDto> {
    const ok = await this.checkConnection();
    const payload = { ok, message: ok ? 'ok' : 'binance ping failed' };
    return GroupPlainToInstance(BinanceHealthDto, payload);
  }

  private async checkConnection(): Promise<boolean> {
    try {
      await this.baseService.ping();
      this.logger.log('Binance connection is OK.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Binance ping failed: ${message}`);
      return false;
    }
  }

  async findTickerPricesFromProvider(
    symbols: string[],
    live = true,
  ): Promise<BinancePriceDto[]> {
    this.checkIfEnabled();

    const normalized = normalizeSymbolsOrThrow(symbols);
    if (!normalized.length) {
      throw new BadRequestException('No symbols provided');
    }

    try {
      const payload = await this.baseService.getTickerPrice({
        symbols: normalized,
      });
      return BinanceMapper.toLatestPrices(payload);
    } catch (error) {
      if (!live) {
        throw error;
      }
    }

    const fallback: BinancePriceDto[] = [];
    for (const symbol of normalized) {
      try {
        const payload = await this.baseService.getTickerPrice({ symbol });
        const mapped = BinanceMapper.toLatestPrices(payload);
        if (mapped.length) fallback.push(mapped[0]);
      } catch {
        fallback.push({ symbol, price: null, source: 'rest' });
      }
    }
    return fallback;
  }

  async findKlinesFromProvider(
    symbol: string,
    interval: string,
    limit: number,
    live = true,
  ): Promise<BinanceCandleDto[]> {
    this.checkIfEnabled();

    const resolvedInterval = interval as BinanceKlineInterval;
    if (!BINANCE_VALID_INTERVALS.includes(resolvedInterval)) {
      throw new BadRequestException(`Invalid interval: ${interval}`);
    }

    const lim = Math.min(Math.max(limit, 1), BINANCE_MAX_KLINE_LIMIT);
    const klines = await this.baseService.getKlines({
      symbol: symbol.toUpperCase(),
      interval: resolvedInterval,
      limit: lim,
    });

    return BinanceMapper.toCandles(klines, {
      source: live ? 'rest' : 'rest',
      now: Date.now(),
    });
  }

  async findSupportedAssetsFromProvider(
    quoteAsset?: string,
  ): Promise<BinanceSupportedAssetDto[]> {
    this.checkIfEnabled();

    const resolvedQuoteAsset =
      quoteAsset ??
      this.defaultQuoteAsset ??
      this.baseService.getDefaultQuoteAsset();
    const info = await this.baseService.getExchangeInfo();

    return BinanceMapper.toSupportedAssets(info, resolvedQuoteAsset);
  }

  async buildChartHeader(
    symbol: string,
    preset: BinanceChartPreset,
    timeZone?: string,
  ) {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const anchorStart = calendarAnchorStart(preset, timeZone);

    const baseline = await this.fetchBaselineOpen(
      upper,
      interval,
      anchorStart,
      timeZone,
    );

    const midPrices = await this.findMidPricesFromProvider([upper]);
    const mid = midPrices?.[0]?.price ? Number(midPrices[0].price) : NaN;

    let priceNow = mid;
    if (!Number.isFinite(priceNow)) {
      const series = await this.getSeriesByPreset(
        upper,
        preset,
        2,
        false,
        timeZone,
      );
      if (series.points.length) {
        priceNow = Number(series.points[series.points.length - 1].close);
      }
    }

    const changePercent =
      baseline && baseline > 0 && Number.isFinite(priceNow)
        ? ((priceNow - baseline) / baseline) * 100
        : null;

    return {
      symbol: upper,
      price: Number.isFinite(priceNow) ? String(priceNow) : null,
      changePercent,
      preset,
      interval,
    };
  }

  async getBaselineOpen(
    symbol: string,
    preset: BinanceChartPreset,
    timeZone?: string,
  ): Promise<{
    baselineOpen: number | null;
    baselineTime: number | null;
    interval: BinanceKlineInterval;
  }> {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const anchorStart = calendarAnchorStart(preset, timeZone);
    const klines = await this.baseService.getKlines({
      symbol: upper,
      interval,
      limit: 2,
      startTime: anchorStart,
      timeZone,
    });

    if (klines.length) {
      return {
        baselineOpen: Number(klines[0][1]),
        baselineTime: klines[0][0],
        interval,
      };
    }

    const series = await this.fetchSeriesRaw(upper, interval, 10, timeZone);
    if (series.points.length) {
      return {
        baselineOpen: Number(series.points[0].open),
        baselineTime: series.points[0].openTime,
        interval,
      };
    }

    return { baselineOpen: null, baselineTime: null, interval };
  }

  async getSeriesByPreset(
    symbol: string,
    preset: BinanceChartPreset,
    limit?: number,
    live = true,
    timeZone?: string,
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const need = Math.ceil(
      BINANCE_PRESET_WINDOW_MS[preset] / intervalMs(interval),
    );
    const lim = Math.min(Math.max(limit ?? need, 10), BINANCE_MAX_KLINE_LIMIT);
    const { points } = await this.fetchSeriesRaw(
      upper,
      interval,
      lim,
      timeZone,
    );

    const base = await this.getBaselineOpen(upper, preset, timeZone);
    const baselineOpen = base.baselineOpen;
    const source: BinanceCandleDto['source'] = live ? 'rest' : 'rest';

    const decorated = points.map((p) => ({
      ...p,
      source,
      changePercent:
        baselineOpen && baselineOpen > 0
          ? ((Number(p.close) - baselineOpen) / baselineOpen) * 100
          : null,
    }));

    return { points: decorated, interval };
  }

  async findMidPricesFromProvider(
    symbols: string[],
  ): Promise<BinanceChartMidPriceDto[]> {
    this.checkIfEnabled();

    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const payload = await this.baseService.getBookTicker({
      symbols: upperSymbols,
    });

    return BinanceMapper.toMidPrices(payload);
  }

  async getSeriesByPresetRange(
    symbol: string,
    preset: BinanceChartPreset,
    opts: { startTime?: number; endTime?: number; limit?: number } = {},
    timeZone?: string,
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const limit = Math.min(
      Math.max(opts.limit ?? BINANCE_MAX_KLINE_LIMIT, 1),
      BINANCE_MAX_KLINE_LIMIT,
    );

    const klines = await this.baseService.getKlines({
      symbol: upper,
      interval,
      limit,
      startTime: opts.startTime,
      endTime: opts.endTime,
      timeZone,
    });

    const points = BinanceMapper.toCandles(klines, {
      source: 'rest',
      now: Date.now(),
    });

    return { points, interval };
  }

  async buildChartSeries(
    symbol: string,
    preset: BinanceChartPreset,
    limit?: number,
    timeZone?: string,
  ): Promise<BinanceChartSeriesDto> {
    const { points, interval } = await this.getSeriesByPreset(
      symbol,
      preset,
      limit,
      true,
      timeZone,
    );
    const base = await this.getBaselineOpen(symbol, preset, timeZone);
    const { baselineOpen, priceStr, changePercent } = computeBaselineStats(
      points,
      base.baselineOpen ?? null,
    );

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

  async buildChartSeriesRange(
    symbol: string,
    preset: BinanceChartPreset,
    opts: { startTime?: number; endTime?: number; limit?: number } = {},
    timeZone?: string,
  ): Promise<BinanceChartSeriesRangeDto> {
    const { points, interval } = await this.getSeriesByPresetRange(
      symbol,
      preset,
      opts,
      timeZone,
    );
    return {
      symbol,
      preset,
      interval,
      points,
      range: { startTime: opts.startTime, endTime: opts.endTime },
    };
  }

  private async fetchBaselineOpen(
    symbol: string,
    interval: BinanceKlineInterval,
    anchorStart: number,
    timeZone?: string,
  ): Promise<number | null> {
    const klines = await this.baseService.getKlines({
      symbol: symbol.toUpperCase(),
      interval,
      limit: 2,
      startTime: anchorStart,
      timeZone,
    });
    return klines.length ? Number(klines[0][1]) : null;
  }

  private async fetchSeriesRaw(
    symbol: string,
    interval: BinanceKlineInterval,
    limit: number,
    timeZone?: string,
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    const now = Date.now();
    const klines = await this.baseService.getKlines({
      symbol,
      interval,
      limit,
      timeZone,
    });

    const points = BinanceMapper.toCandles(klines, {
      source: 'rest',
      now,
    });

    return { points: sliceCandles(points, limit), interval };
  }

  private parseSymbols(csv: string): string[] {
    return parseSymbolCsv(csv);
  }
}
