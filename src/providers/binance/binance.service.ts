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
import {
  berlinCalendarAnchorStart,
  intervalMs,
  normalizeAssetPair,
} from './binance.helper';
import { BinanceCandleDto } from './dto/binance-klines.dto';
import { BinanceSupportedAssetDto } from './dto/binance-account.dto';
import { BinanceBaseService } from './services/binance-base.service';
import { BinanceMapper } from './infrastructure/persistence/relational/mappers/binance.mapper';
import { BinanceChartMidPriceDto } from './dto/binance-chart.dto';
import { BinancePriceDto } from './dto/binance-price.dto';

@Injectable()
export class BinanceService
  extends BaseToggleableService
  implements OnModuleInit
{
  constructor(
    private readonly baseService: BinanceBaseService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super(
      BinanceService.name,
      configService.get('binance.enable', { infer: true }) ?? false,
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
    if (!ok) {
      this.logger.warn('Binance connectivity check failed.');
    }
  }

  isReady(): boolean {
    return this.isEnabled && this.baseService.isReady();
  }

  private async checkConnection(): Promise<boolean> {
    try {
      await this.baseService.ping();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Binance ping failed: ${message}`);
      return false;
    }
  }

  async getLatestPrices(
    symbols: string[],
    live = true,
  ): Promise<BinancePriceDto[]> {
    this.checkIfEnabled();

    const normalized = this.normalizeSymbols(symbols);
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

  async getCandlesticks(
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

  async getSupportedAssets(
    quoteAsset?: string,
  ): Promise<BinanceSupportedAssetDto[]> {
    this.checkIfEnabled();

    const defaultQuoteAsset = this.baseService.getDefaultQuoteAsset();
    const resolvedQuoteAsset = quoteAsset ?? defaultQuoteAsset;
    const info = await this.baseService.getExchangeInfo();

    return BinanceMapper.toSupportedAssets(info, resolvedQuoteAsset);
  }

  async getChartHeader(symbol: string, preset: BinanceChartPreset) {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const anchorStart = berlinCalendarAnchorStart(preset);

    const baseline = await this.fetchBaselineOpen(upper, interval, anchorStart);

    const midPrices = await this.getMidPrices([upper]);
    const mid = midPrices?.[0]?.price ? Number(midPrices[0].price) : NaN;

    let priceNow = mid;
    if (!Number.isFinite(priceNow)) {
      const series = await this.getSeriesByPreset(upper, preset, 2, false);
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
  ): Promise<{
    baselineOpen: number | null;
    baselineTime: number | null;
    interval: BinanceKlineInterval;
  }> {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const anchorStart = berlinCalendarAnchorStart(preset);
    const klines = await this.baseService.getKlines({
      symbol: upper,
      interval,
      limit: 2,
      startTime: anchorStart,
    });

    if (klines.length) {
      return {
        baselineOpen: Number(klines[0][1]),
        baselineTime: klines[0][0],
        interval,
      };
    }

    const series = await this.fetchSeriesRaw(upper, interval, 10);
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
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    this.checkIfEnabled();

    const upper = symbol.toUpperCase();
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const need = Math.ceil(
      BINANCE_PRESET_WINDOW_MS[preset] / intervalMs(interval),
    );
    const lim = Math.min(Math.max(limit ?? need, 10), BINANCE_MAX_KLINE_LIMIT);
    const { points } = await this.fetchSeriesRaw(upper, interval, lim);

    const base = await this.getBaselineOpen(upper, preset);
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

  async getMidPrices(symbols: string[]): Promise<BinanceChartMidPriceDto[]> {
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
    });

    const points = BinanceMapper.toCandles(klines, {
      source: 'rest',
      now: Date.now(),
    });

    return { points, interval };
  }

  private async fetchBaselineOpen(
    symbol: string,
    interval: BinanceKlineInterval,
    anchorStart: number,
  ): Promise<number | null> {
    const klines = await this.baseService.getKlines({
      symbol: symbol.toUpperCase(),
      interval,
      limit: 2,
      startTime: anchorStart,
    });
    return klines.length ? Number(klines[0][1]) : null;
  }

  private async fetchSeriesRaw(
    symbol: string,
    interval: BinanceKlineInterval,
    limit: number,
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    const now = Date.now();
    const klines = await this.baseService.getKlines({
      symbol,
      interval,
      limit,
    });

    let points: BinanceCandleDto[] = BinanceMapper.toCandles(klines, {
      source: 'rest',
      now,
    });

    if (points.length > limit) {
      points = points.slice(-limit);
    }

    return { points, interval };
  }

  private normalizeSymbols(symbols: string[]): string[] {
    const normalized: string[] = [];
    for (const s of symbols) {
      try {
        normalized.push(normalizeAssetPair(s));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Invalid symbol format';
        throw new BadRequestException(message);
      }
    }
    return normalized;
  }
}
