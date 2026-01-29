import {
  BadRequestException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
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

const BINANCE_KLINES_ENDPOINT = '/api/v3/klines';
const BINANCE_TICKER_PRICE_ENDPOINT = '/api/v3/ticker/price';
const BINANCE_BOOK_TICKER_ENDPOINT = '/api/v3/ticker/bookTicker';
const BINANCE_EXCHANGE_INFO_ENDPOINT = '/api/v3/exchangeInfo';

type BinanceKlineRaw = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

type BinanceBookTicker = {
  symbol: string;
  bidPrice: string;
  askPrice: string;
};

@Injectable()
export class BinanceService
  extends BaseToggleableService
  implements OnModuleInit
{
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    super(
      BinanceService.name,
      configService.get('binance.enable', { infer: true }) ?? false,
    );

    this.http = axios.create({
      baseURL:
        this.configService.get('binance.baseUrl', { infer: true }) ?? undefined,
      timeout:
        this.configService.get('binance.requestTimeoutMs', {
          infer: true,
        }) ?? undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('Binance service is DISABLED. Skipping initialization.');
      return;
    }

    this.logger.log('Binance service is ENABLED. Ready to handle requests.');
  }

  async getLatestPrices(symbols: string[], live = true) {
    this.checkIfEnabled();

    let normalized: string[] = [];
    try {
      normalized = symbols.map((s) => normalizeAssetPair(s));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid symbol format';
      throw new BadRequestException(message);
    }
    if (!normalized.length) {
      throw new BadRequestException('No symbols provided');
    }

    try {
      const response = await this.http.get(BINANCE_TICKER_PRICE_ENDPOINT, {
        params: {
          symbols: JSON.stringify(normalized),
        },
      });
      const data = Array.isArray(response.data) ? response.data : [];
      return data.map((entry: { symbol: string; price: string }) => ({
        symbol: entry.symbol,
        price: entry.price ?? null,
        source: 'rest' as const,
      }));
    } catch (error) {
      if (!live) {
        throw error;
      }
    }

    const result: { symbol: string; price: string | null; source: 'rest' }[] = [];

    for (const symbol of normalized) {
      try {
        const response = await this.http.get(BINANCE_TICKER_PRICE_ENDPOINT, {
          params: { symbol },
        });
        result.push({
          symbol,
          price: response.data?.price ?? null,
          source: 'rest',
        });
      } catch {
        result.push({ symbol, price: null, source: 'rest' });
      }
    }

    return result;
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
    const response = await this.http.get(BINANCE_KLINES_ENDPOINT, {
      params: { symbol: symbol.toUpperCase(), interval: resolvedInterval, limit: lim },
    });

    return (response.data as BinanceKlineRaw[]).map((c) => ({
      openTime: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
      closeTime: c[6],
      closed: Date.now() >= c[6],
      source: live ? 'rest' : 'rest',
    }));
  }

  async getSupportedAssets(quoteAsset?: string): Promise<BinanceSupportedAssetDto[]> {
    this.checkIfEnabled();

    const defaultQuoteAsset =
      this.configService.get('binance.defaultQuoteAsset', { infer: true }) ??
      undefined;
    const resolvedQuoteAsset = quoteAsset ?? defaultQuoteAsset;
    const response = await this.http.get(BINANCE_EXCHANGE_INFO_ENDPOINT);
    const symbols = Array.isArray(response.data?.symbols)
      ? response.data.symbols
      : [];

    let tradingSymbols = symbols.filter(
      (s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed,
    );

    if (resolvedQuoteAsset) {
      tradingSymbols = tradingSymbols.filter(
        (s: any) => s.quoteAsset === resolvedQuoteAsset.toUpperCase(),
      );
    }

    return tradingSymbols.map((s: any) => ({
      symbol: s.symbol,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
    }));
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

    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const anchorStart = berlinCalendarAnchorStart(preset);
    const response = await this.http.get(BINANCE_KLINES_ENDPOINT, {
      params: {
        symbol: symbol.toUpperCase(),
        interval,
        limit: 2,
        startTime: anchorStart,
      },
    });

    const ks = response.data as BinanceKlineRaw[];
    if (ks.length) {
      return {
        baselineOpen: Number(ks[0][1]),
        baselineTime: ks[0][0],
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

  async getMidPrices(symbols: string[]) {
    this.checkIfEnabled();

    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const response = await this.http.get(BINANCE_BOOK_TICKER_ENDPOINT, {
      params: { symbols: JSON.stringify(upperSymbols) },
    });

    const data = Array.isArray(response.data) ? response.data : [response.data];

    return data.map((entry: BinanceBookTicker) => {
      const bid = Number(entry.bidPrice);
      const ask = Number(entry.askPrice);
      const mid = Number.isFinite(bid) && Number.isFinite(ask)
        ? ((bid + ask) / 2).toString()
        : null;
      return {
        symbol: entry.symbol,
        price: mid,
        source: 'rest:mid' as const,
      };
    });
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
    const now = Date.now();

    const response = await this.http.get(BINANCE_KLINES_ENDPOINT, {
      params: {
        symbol: upper,
        interval,
        limit,
        startTime: opts.startTime,
        endTime: opts.endTime,
      },
    });

    const points: BinanceCandleDto[] = (response.data as BinanceKlineRaw[]).map(
      (c) => ({
        openTime: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
        closeTime: c[6],
        closed: now >= c[6],
        source: 'rest',
      }),
    );

    return { points, interval };
  }

  private async fetchBaselineOpen(
    symbol: string,
    interval: BinanceKlineInterval,
    anchorStart: number,
  ): Promise<number | null> {
    const response = await this.http.get(BINANCE_KLINES_ENDPOINT, {
      params: {
        symbol: symbol.toUpperCase(),
        interval,
        limit: 2,
        startTime: anchorStart,
      },
    });
    const ks = response.data as BinanceKlineRaw[];
    return ks.length ? Number(ks[0][1]) : null;
  }

  private async fetchSeriesRaw(
    symbol: string,
    interval: BinanceKlineInterval,
    limit: number,
  ): Promise<{ points: BinanceCandleDto[]; interval: BinanceKlineInterval }> {
    const now = Date.now();
    const response = await this.http.get(BINANCE_KLINES_ENDPOINT, {
      params: { symbol, interval, limit },
    });

    let points: BinanceCandleDto[] = (response.data as BinanceKlineRaw[]).map(
      (c) => ({
        openTime: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5],
        closeTime: c[6],
        closed: now >= c[6],
        source: 'rest',
      }),
    );

    if (points.length > limit) {
      points = points.slice(-limit);
    }

    return { points, interval };
  }
}
