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
  BinanceKlineRaw,
  BinancePingResponseDto,
  BinanceTimeResponseDto,
  BinanceTickerPriceResponseDto,
} from '../dto/binance-base.response.dto';
import {
  BinanceBookTickerRequestDto,
  BinanceExchangeInfoRequestDto,
  BinanceKlinesRequestDto,
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
    const data = await this.call(BINANCE_ENDPOINT_NAME.tickerPrice, {
      query: this.buildSymbolsQuery(payload),
    });
    return this.toDto(BinanceTickerPriceResponseDto, data);
  }

  async getBookTicker(
    payload: BinanceBookTickerRequestDto,
  ): Promise<BinanceBookTickerResponseDto | BinanceBookTickerResponseDto[]> {
    const data = await this.call(BINANCE_ENDPOINT_NAME.bookTicker, {
      query: this.buildSymbolsQuery(payload),
    });
    return this.toDto(BinanceBookTickerResponseDto, data);
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
    return this.call(BINANCE_ENDPOINT_NAME.klines, { query });
  }

  async getExchangeInfo(
    payload: BinanceExchangeInfoRequestDto = {},
  ): Promise<BinanceExchangeInfoResponseDto> {
    const query = this.buildSymbolsQuery(payload);
    if (payload.permissions?.length) {
      Object.assign(query, { permissions: payload.permissions });
    }
    if (payload.showPermissionSets !== undefined) {
      Object.assign(query, { showPermissionSets: payload.showPermissionSets });
    }
    const data = await this.call(BINANCE_ENDPOINT_NAME.exchangeInfo, { query });
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
    const data = await this.call(BINANCE_ENDPOINT_NAME.time);
    return this.toDto(BinanceTimeResponseDto, data) as BinanceTimeResponseDto;
  }

  private buildSymbolsQuery(
    payload:
      | BinanceTickerPriceRequestDto
      | BinanceBookTickerRequestDto
      | BinanceExchangeInfoRequestDto,
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
}
