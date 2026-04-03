import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { BaseToggleableService } from 'src/common/base/base-toggleable.service';
import {
  CMC_DEFAULT_FIAT_CURRENCY,
  CMC_ENABLE,
  CMC_TTL_MS,
} from './types/cmc-const.type';
import { ConfigGet } from '../../config/config.decorator';
import { CmcBaseService } from './services/cmc-base.service';
import { CacheService } from 'src/common/cache';
import dayjs from 'dayjs';
import { RoleEnum } from 'src/roles/roles.enum';
import { GroupPlainToInstance } from 'src/utils/transformers/class.transformer';
import {
  GlobalStatsDto,
  HistoryBatchedResponseDto,
  HistoryQueryDto,
  HistoryResponseDto,
  HistoryBatchedQueryDto,
  MetadataQueryDto,
  MetadataResponseDto,
  PricesQueryDto,
  PricesResponseDto,
  QuotesHistoricalV2QueryDto,
  QuotesHistoricalV2ResponseDto,
} from './dto/cmc-client.dto';
import { CmcCryptoOhlcvHistoricalV1Dto } from './dto/cmc-cryptocurrency.dto';
import { CmcKeyInfoDto } from './dto/cmc-info.dto';
import { buildQuotesHistoricalDto } from './helper/quotes-preset.helper';
import {
  mapGlobalStats,
  mapMetadata,
  mapPriceEntry,
} from './infrastructure/persistence/relational/mappers/cmc.mapper';
import { CmcHealthDto } from './dto/cmc-health.dto';

@Injectable()
export class CmcService extends BaseToggleableService implements OnModuleInit {
  static readonly displayName = 'CoinMarketCap';
  private static readonly CACHE_KEY_PRICES = 'cmc:prices';
  private static readonly CACHE_KEY_METADATA = 'cmc:metadata';
  private static readonly CACHE_KEY_GLOBAL = 'cmc:global';
  private static readonly CACHE_KEY_OHLCV_HISTORY = 'cmc:ohlcv:history';
  private static readonly CACHE_KEY_OHLCV_HISTORY_BATCH =
    'cmc:ohlcv:history:batched';
  private static readonly CACHE_KEY_QUOTES_HIST_V2 = 'cmc:quotes:historical:v2';

  @ConfigGet('cmc.defaultFiatCurrency', {
    inferEnvVar: true,
    defaultValue: CMC_DEFAULT_FIAT_CURRENCY,
  })
  private readonly defaultFiat!: string;

  @ConfigGet('cmc.ttlMs', {
    inferEnvVar: true,
    defaultValue: CMC_TTL_MS,
  })
  private readonly ttlMs!: number;

  /** Cache TTL in seconds derived once from ttlMs */
  private get ttlSeconds(): number {
    return Math.max(1, Math.floor(this.ttlMs / 1000));
  }

  constructor(
    private readonly baseService: CmcBaseService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly cacheService: CacheService,
  ) {
    super(
      CmcService.name,
      configService.get('cmc.enable', CMC_ENABLE, { infer: true }),
      {
        id: 'coinmarketcap',
        displayName: CmcService.displayName,
        configKey: 'cmc.enable',
        envKey: 'CMC_ENABLE',
        description: 'CoinMarketCap provider.',
        tags: ['provider', 'crypto'],
      },
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('CMC service is DISABLED. Skipping initialization.');
      return;
    }

    if (!this.baseService.isReady()) {
      this.logger.warn('CMC API client is not ready.');
      return;
    }

    await this.checkConnection();
  }

  /** Returns true when the service is enabled and a client is available. */
  public isReady(): boolean {
    return this.isEnabled && this.baseService.isReady();
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.getKeyInfo();
      this.logger.log('CMC connection is OK.');
    } catch (e: any) {
      this.logger.warn(`CMC connectivity check failed: ${e?.message || e}`);
    }
  }

  async getKeyInfo(): Promise<CmcKeyInfoDto> {
    const payload = await this.baseService.getKeyInfo();
    return GroupPlainToInstance(CmcKeyInfoDto, payload, [RoleEnum.admin]);
  }

  async health(): Promise<CmcHealthDto> {
    let restOk = false;
    let restMessage: string | undefined;
    try {
      await this.baseService.getKeyInfo();
      restOk = true;
      restMessage = 'ok';
    } catch (e: any) {
      restOk = false;
      restMessage = e?.message ?? 'connection failed';
    }

    const health: CmcHealthDto = {
      status: restOk,
      enable: this.isEnabled,
      realtime: false, // no realtime channel for CMC
      details: {
        restApi: { status: restOk, message: restMessage },
      },
    };
    return GroupPlainToInstance(CmcHealthDto, health, [RoleEnum.admin]);
  }

  async getPrices(query: PricesQueryDto): Promise<PricesResponseDto> {
    const symbolsRaw =
      query.symbols
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    if (symbolsRaw.length !== 1) {
      throw {
        status: {
          error_code: 400,
          error_message: 'This endpoint accepts exactly one symbol.',
        },
      };
    }
    const symbol = symbolsRaw[0];
    const ttlSeconds = this.ttlSeconds;
    const cacheKey = `${CmcService.CACHE_KEY_PRICES}:${symbol}`;

    const cached = await this.cacheService.cached<PricesResponseDto>(
      { key: cacheKey, scope: 'global', ttl: ttlSeconds },
      { className: CmcService.name, handlerName: 'getPrices' },
      [symbol],
      async () => {
        const payload = await this.baseService.getQuotesLatest({
          symbol,
          convert: this.defaultFiat,
        });
        const mapped = mapPriceEntry(payload, symbol, this.defaultFiat);
        return GroupPlainToInstance(PricesResponseDto, mapped, [
          RoleEnum.admin,
        ]);
      },
    );

    return cached.value;
  }

  async getMetadata(query: MetadataQueryDto): Promise<MetadataResponseDto> {
    const symbols =
      query.symbols
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [];
    if (symbols.length === 0) {
      throw {
        status: { error_code: 400, error_message: "'symbols' is required" },
      };
    }

    const ttlSeconds = this.ttlSeconds;
    const cacheKey = `${CmcService.CACHE_KEY_METADATA}:${symbols
      .sort()
      .join(',')}`;

    const cached = await this.cacheService.cached<MetadataResponseDto>(
      { key: cacheKey, scope: 'global', ttl: ttlSeconds },
      { className: CmcService.name, handlerName: 'getMetadata' },
      [symbols],
      async () => {
        const payload = await this.baseService.getCryptoInfo({
          symbol: symbols.join(','),
        });
        const mapped = mapMetadata(payload);
        return GroupPlainToInstance(MetadataResponseDto, mapped, [
          RoleEnum.admin,
        ]);
      },
    );

    return cached.value;
  }

  async getGlobalStats(): Promise<GlobalStatsDto> {
    const ttlSeconds = this.ttlSeconds;
    const cacheKey = CmcService.CACHE_KEY_GLOBAL;

    const cached = await this.cacheService.cached<GlobalStatsDto>(
      { key: cacheKey, scope: 'global', ttl: ttlSeconds },
      { className: CmcService.name, handlerName: 'getGlobalStats' },
      [],
      async () => {
        const payload = await this.baseService.getGlobalMetricsLatest({
          convert: this.defaultFiat,
        });
        const mapped = mapGlobalStats(payload, this.defaultFiat);
        return GroupPlainToInstance(GlobalStatsDto, mapped, [RoleEnum.admin]);
      },
    );

    return cached.value;
  }

  async getHistory(query: HistoryQueryDto): Promise<HistoryResponseDto> {
    const {
      symbol,
      from,
      to,
      time_period,
      interval = 'daily',
      convert = this.defaultFiat,
    } = query;
    if (!symbol || !from || !to || !time_period) {
      throw {
        status: {
          error_code: 400,
          error_message:
            "Required query params: 'symbol', 'from', 'to', and 'time_period' (daily|hourly)",
        },
      };
    }

    const ttlSeconds = this.ttlSeconds;
    const cacheKey = `${CmcService.CACHE_KEY_OHLCV_HISTORY}:${symbol}:${from}:${to}:${time_period}:${interval}:${convert}`;

    const cached = await this.cacheService.cached<HistoryResponseDto>(
      { key: cacheKey, scope: 'global', ttl: ttlSeconds },
      { className: CmcService.name, handlerName: 'getHistory' },
      [symbol, from, to, time_period, interval, convert],
      async () => {
        const payload = await this.baseService.getOhlcvHistorical({
          symbol,
          time_start: from,
          time_end: to,
          time_period,
          interval,
          convert,
        });
        return payload;
      },
    );

    return cached.value;
  }

  async getHistoryBatched(
    query: HistoryBatchedQueryDto,
  ): Promise<HistoryBatchedResponseDto> {
    const {
      symbol,
      from,
      to,
      time_period,
      interval = 'daily',
      convert = this.defaultFiat,
    } = query;
    if (!symbol || !from || !to || !time_period) {
      throw {
        status: {
          error_code: 400,
          error_message:
            'Required query parameters: symbol, from, to, and time_period (daily|hourly)',
        },
      };
    }

    const ttlSeconds = this.ttlSeconds;
    const cacheKey = `${CmcService.CACHE_KEY_OHLCV_HISTORY_BATCH}:${symbol}:${from}:${to}:${time_period}:${interval}:${convert}`;

    const cached = await this.cacheService.cached<HistoryBatchedResponseDto>(
      { key: cacheKey, scope: 'global', ttl: ttlSeconds },
      { className: CmcService.name, handlerName: 'getHistoryBatched' },
      [symbol, from, to, time_period, interval, convert],
      async () => {
        const MAX_POINTS = 9999;
        const items: any[] = [];
        const start = dayjs(from);
        const end = dayjs(to);
        if (!start.isValid() || !end.isValid()) {
          throw {
            status: {
              error_code: 400,
              error_message: "Invalid date format (expected 'YYYY-MM-DD')",
            },
          };
        }
        const stepDays =
          time_period === 'daily' ? MAX_POINTS : Math.floor(MAX_POINTS / 24);
        let currentStart = start;
        while (currentStart.isBefore(end) || currentStart.isSame(end, 'day')) {
          const currentEnd = currentStart.add(stepDays, 'day');
          const toDate = currentEnd.isBefore(end) ? currentEnd : end;
          const batch = await this.baseService.getOhlcvHistorical({
            symbol,
            time_start: currentStart.format('YYYY-MM-DD'),
            time_end: toDate.format('YYYY-MM-DD'),
            time_period,
            interval,
            convert,
          });

          const quotes =
            (batch as CmcCryptoOhlcvHistoricalV1Dto)?.data?.quotes ??
            (batch as any)?.quotes ??
            (batch as any);
          if (Array.isArray(quotes)) {
            items.push(...quotes);
          } else if (quotes) {
            items.push(quotes);
          }
          currentStart = toDate.add(1, 'day');
        }
        return items;
      },
    );

    return cached.value;
  }

  async getQuotesHistoricalV2(
    query: QuotesHistoricalV2QueryDto,
  ): Promise<QuotesHistoricalV2ResponseDto> {
    if (!query.symbols && !query.ids) {
      throw {
        status: {
          error_code: 400,
          error_message: "Either 'symbols' or 'ids' required",
        },
      };
    }

    const ttlSeconds = this.ttlSeconds;
    const cacheKey = `${CmcService.CACHE_KEY_QUOTES_HIST_V2}:${JSON.stringify(
      query,
    )}`;

    const cached =
      await this.cacheService.cached<QuotesHistoricalV2ResponseDto>(
        { key: cacheKey, scope: 'global', ttl: ttlSeconds },
        { className: CmcService.name, handlerName: 'getQuotesHistoricalV2' },
        [query],
        async () => {
          const dto = buildQuotesHistoricalDto(query, this.defaultFiat);
          const payload = await this.baseService.getQuotesHistoricalV2(dto);
          return payload;
        },
      );

    return cached.value;
  }
}
