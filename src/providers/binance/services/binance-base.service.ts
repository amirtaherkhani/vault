import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayService } from 'src/common/api-gateway/api-gateway.service';
import {
  ApiFunction,
  RequestInput,
} from 'src/common/api-gateway/types/api-gateway.type';
import { plainToInstance } from 'class-transformer';
import { AllConfigType } from '../../../config/config.type';
import {
  BinanceBookTickerResponseDto,
  BinanceExchangeInfoResponseDto,
  BinancePingResponseDto,
  BinanceTimeResponseDto,
  BinanceTickerPriceResponseDto,
  BinanceExecutionRulesResponseDto,
} from '../dto/binance-base.response.dto';
import {
  BinanceBookTickerRequestDto,
  BinanceExchangeInfoRequestDto,
  BinanceKlinesRequestDto,
  BinanceExecutionRulesRequestDto,
  BinanceTickerPriceRequestDto,
} from '../dto/binance-base.request.dto';
import {
  BINANCE_BASE_URLS,
  BINANCE_DEFAULT_QUOTE_ASSET,
} from '../types/binance-const.type';
import {
  BINANCE_ENDPOINT_NAME,
  BinanceEndpointName,
} from '../types/binance-base.type';
import { BinanceKlineRaw } from '../dto/binance-klines.dto';

@Injectable()
export class BinanceBaseService implements OnModuleInit {
  private readonly logger = new Logger(BinanceBaseService.name);
  private apiClient: Record<string, ApiFunction> = {};
  private baseUrlCandidates: string[] = [];

  constructor(
    private readonly apiGateway: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject('API_GATEWAY_BINANCE')
    apiClient?: Record<string, ApiFunction>,
  ) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  private get isEnabled(): boolean {
    return this.configService.get('binance.enable', { infer: true }) ?? false;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn(
        'Binance base transport is DISABLED. Skipping initialization.',
      );
      return;
    }

    this.ensureClient();
    this.prepareBaseUrls();
    this.apiGateway.updateBaseUrl('BINANCE', this.baseUrlCandidates[0]);

    this.apiGateway.updateHeaders('BINANCE', {
      Accept: 'application/json',
    });
  }

  isReady(): boolean {
    return (
      this.isEnabled &&
      !!this.apiClient &&
      Object.keys(this.apiClient).length > 0
    );
  }

  async getTickerPrice(
    payload: BinanceTickerPriceRequestDto,
  ): Promise<BinanceTickerPriceResponseDto | BinanceTickerPriceResponseDto[]> {
    const data = this.unwrap(
      await this.call(BINANCE_ENDPOINT_NAME.tickerPrice, {
        query: this.buildSymbolsQuery(payload),
      }),
    );

    if (Array.isArray(data)) {
      return this.toDto(BinanceTickerPriceResponseDto, data);
    }

    if (data && typeof data === 'object' && 'symbol' in data) {
      return this.toDto(BinanceTickerPriceResponseDto, data);
    }

    const preview =
      data && typeof data === 'object'
        ? JSON.stringify(data).slice(0, 200)
        : String(data);
    throw new Error(
      `Unexpected ticker price payload from Binance; expected object/array, got ${preview}`,
    );
  }

  async getBookTicker(
    payload: BinanceBookTickerRequestDto,
  ): Promise<BinanceBookTickerResponseDto | BinanceBookTickerResponseDto[]> {
    const data = this.unwrap(
      await this.call(BINANCE_ENDPOINT_NAME.bookTicker, {
        query: this.buildSymbolsQuery(payload),
      }),
    );

    if (Array.isArray(data)) {
      return this.toDto(BinanceBookTickerResponseDto, data);
    }

    if (data && typeof data === 'object' && 'symbol' in data) {
      return this.toDto(BinanceBookTickerResponseDto, data);
    }

    const preview =
      data && typeof data === 'object'
        ? JSON.stringify(data).slice(0, 200)
        : String(data);
    throw new Error(
      `Unexpected bookTicker payload from Binance; expected object/array, got ${preview}`,
    );
  }

  async getKlines(
    payload: BinanceKlinesRequestDto,
  ): Promise<BinanceKlineRaw[]> {
    const { symbol, interval, startTime, endTime, limit, timeZone } = payload;
    const query = {
      symbol,
      interval,
      startTime,
      endTime,
      limit,
      timeZone,
    };
    const data = this.unwrap(
      await this.call(BINANCE_ENDPOINT_NAME.klines, { query }),
    );
    if (!Array.isArray(data)) {
      const preview =
        data && typeof data === 'object'
          ? JSON.stringify(data).slice(0, 200)
          : String(data);
      throw new Error(
        `Unexpected klines payload from Binance; expected array, got ${preview}`,
      );
    }
    return data as BinanceKlineRaw[];
  }

  async getExchangeInfo(
    payload: BinanceExchangeInfoRequestDto = { permissions: ['SPOT'] },
  ): Promise<BinanceExchangeInfoResponseDto> {
    const permissions =
      payload.permissions && payload.permissions.length > 0
        ? payload.permissions
        : ['SPOT'];
    const query = this.buildSymbolsQuery(payload);
    if (permissions?.length) {
      Object.assign(query, {
        permissions:
          permissions.length === 1
            ? permissions[0]
            : JSON.stringify(permissions),
      });
    }
    if (payload.showPermissionSets !== undefined) {
      Object.assign(query, { showPermissionSets: payload.showPermissionSets });
    }
    const data = this.unwrap(
      await this.call(BINANCE_ENDPOINT_NAME.exchangeInfo, { query }),
    );
    return this.toDto(
      BinanceExchangeInfoResponseDto,
      data,
    ) as BinanceExchangeInfoResponseDto;
  }

  async ping(): Promise<BinancePingResponseDto> {
    const data = await this.call(BINANCE_ENDPOINT_NAME.ping);
    return this.toDto(BinancePingResponseDto, data) as BinancePingResponseDto;
  }

  async getServerTime(): Promise<BinanceTimeResponseDto> {
    const data = this.unwrap(await this.call(BINANCE_ENDPOINT_NAME.time));
    return this.toDto(BinanceTimeResponseDto, data) as BinanceTimeResponseDto;
  }

  async getExecutionRules(
    payload: BinanceExecutionRulesRequestDto = {},
  ): Promise<BinanceExecutionRulesResponseDto> {
    const data = this.unwrap(
      await this.call(BINANCE_ENDPOINT_NAME.executionRules, {
        query: this.buildSymbolsQuery(payload),
      }),
    );
    return this.toDto(
      BinanceExecutionRulesResponseDto,
      data,
    ) as BinanceExecutionRulesResponseDto;
  }

  private buildSymbolsQuery(
    payload:
      | BinanceTickerPriceRequestDto
      | BinanceBookTickerRequestDto
      | BinanceExchangeInfoRequestDto
      | BinanceExecutionRulesRequestDto,
  ): Record<string, unknown> {
    const query: Record<string, unknown> = {};
    if (payload.symbol && !payload.symbols?.length) {
      query.symbol = payload.symbol;
    } else if (payload.symbols?.length) {
      query.symbols = JSON.stringify(payload.symbols);
    }
    if ('symbolStatus' in payload && payload.symbolStatus) {
      query.symbolStatus = payload.symbolStatus;
    }
    return query;
  }

  private ensureClient(): void {
    if (!this.apiClient || Object.keys(this.apiClient).length === 0) {
      this.apiClient = this.apiGateway.getClient('BINANCE');
    }
  }

  private prepareBaseUrls(): void {
    const primary =
      this.configService.get('binance.baseUrl', { infer: true }) ??
      BINANCE_BASE_URLS[0];
    const alts =
      this.configService.get('binance.altBaseUrls', { infer: true }) ??
      BINANCE_BASE_URLS.slice(1);
    const deduped = Array.from(new Set([primary, ...(alts || [])])).filter(
      Boolean,
    ) as string[];
    this.baseUrlCandidates = deduped.length ? deduped : [BINANCE_BASE_URLS[0]];
  }

  private async call<T = unknown>(
    endpointName: BinanceEndpointName,
    input: RequestInput = {},
  ): Promise<T> {
    if (!this.isEnabled) {
      throw new Error('Binance provider is disabled by configuration');
    }
    return this.callWithFallback(endpointName, input, 0);
  }

  getDefaultQuoteAsset(): string {
    return (
      this.configService.get('binance.defaultQuoteAsset', { infer: true }) ??
      BINANCE_DEFAULT_QUOTE_ASSET
    );
  }

  private async callWithFallback<T>(
    endpointName: BinanceEndpointName,
    input: RequestInput,
    attempt: number,
  ): Promise<T> {
    this.ensureClient();
    const endpointFn = this.apiClient[endpointName];
    if (typeof endpointFn !== 'function') {
      throw new Error(`Missing Binance endpoint: ${endpointName}`);
    }
    try {
      return await endpointFn(input);
    } catch (error) {
      const nextIndex = attempt + 1;
      const nextBase = this.baseUrlCandidates[nextIndex];
      if (!nextBase) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Binance request failed and no fallback URL left. endpoint=${endpointName} attempt=${attempt + 1} error=${message}`,
        );
        throw error;
      }
      this.logger.warn(
        `Binance request failed on baseUrl ${this.baseUrlCandidates[attempt]} (attempt ${attempt + 1}); trying fallback ${nextBase}`,
      );
      this.apiGateway.updateBaseUrl('BINANCE', nextBase);
      this.ensureClient();
      return this.callWithFallback(endpointName, input, nextIndex);
    }
  }

  private toDto<T>(cls: new () => T, data: any): T | T[] {
    if (Array.isArray(data)) {
      return plainToInstance(cls, data);
    }
    return plainToInstance(cls, data);
  }

  private unwrap<T>(data: any): T {
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as any).data as T;
    }
    return data as T;
  }
}
