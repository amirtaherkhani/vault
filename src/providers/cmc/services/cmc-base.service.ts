import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiGatewayService } from 'src/common/api-gateway/api-gateway.service';
import {
  ApiFunction,
  RequestInput,
} from 'src/common/api-gateway/types/api-gateway.type';
import { plainToInstance } from 'class-transformer';
import { AllConfigType } from 'src/config/config.type';
import { ConfigGet, ConfigGetOrThrow } from 'src/config/config.decorator';
import { getCmcBaseUrl } from '../cmc.helper';
import { CmcEnvironmentType } from '../types/cmc-enum.type';
import { CMC_DEFAULT_FIAT_CURRENCY, CMC_ENABLE } from '../types/cmc-const.type';
import {
  CmcGlobalMetricsHistoricalQueryDto,
  CmcGlobalMetricsQueryDto,
  CmcPriceConversionV1QueryDto,
  CmcFiatMapQueryDto,
  CmcBlockchainStatisticsLatestQueryDto,
  CmcFearAndGreedHistoricalQueryDto,
  CmcCryptoMapQueryDto,
  CmcCryptoInfoQueryDto,
  CmcCryptoListingsLatestQueryDto,
  CmcCryptoQuotesLatestV1QueryDto,
  CmcCryptoQuotesHistoricalV1QueryDto,
  CmcCryptoOhlcvLatestV1QueryDto,
  CmcCryptoOhlcvHistoricalV1QueryDto,
  CmcCryptoMarketPairsLatestV1QueryDto,
  CmcTrendingQueryDto,
  CmcExchangeMapQueryDto,
  CmcExchangeInfoQueryDto,
  CmcExchangeQuotesLatestQueryDto,
  CmcExchangeMarketPairsLatestQueryDto,
  CmcExchangeListingsLatestQueryDto,
  CmcExchangeQuotesHistoricalQueryDto,
} from '../dto/cmc-base.query.dto';
import {
  CmcAirdropDto,
  CmcAirdropsDto,
  CmcBlockchainStatisticsLatestDto,
  CmcCategoriesDto,
  CmcCategoryDto,
  CmcCryptoInfoV1Dto,
  CmcCryptoInfoV2Dto,
  CmcCryptoListingsHistoricalDto,
  CmcCryptoListingsLatestV1Dto,
  CmcCryptoListingsLatestV3Dto,
  CmcCryptoMapV1Dto,
  CmcCryptoMarketPairsLatestV1Dto,
  CmcCryptoMarketPairsLatestV2Dto,
  CmcCryptoOhlcvHistoricalV1Dto,
  CmcCryptoOhlcvHistoricalV2Dto,
  CmcCryptoOhlcvLatestV1Dto,
  CmcCryptoOhlcvLatestV2Dto,
  CmcCryptoQuotesHistoricalV1Dto,
  CmcCryptoQuotesHistoricalV2Dto,
  CmcCryptoQuotesHistoricalV3Dto,
  CmcCryptoQuotesLatestV1Dto,
  CmcCryptoQuotesLatestV2Dto,
  CmcCryptoQuotesLatestV3Dto,
  CmcExchangeAssetsDto,
  CmcExchangeInfoDto,
  CmcExchangeListingsLatestDto,
  CmcExchangeMapDto,
  CmcExchangeMarketPairsLatestDto,
  CmcExchangeQuotesHistoricalDto,
  CmcExchangeQuotesLatestDto,
  CmcFearAndGreedHistoricalDto,
  CmcFearAndGreedLatestDto,
  CmcFiatMapDto,
  CmcGlobalMetricsQuotesHistoricalDto,
  CmcGlobalMetricsQuotesLatestDto,
  CmcIndexCmc100HistoricalDto,
  CmcIndexCmc100LatestDto,
  CmcIndexCmc20HistoricalDto,
  CmcIndexCmc20LatestDto,
  CmcKeyInfoDto,
  CmcPostmanDto,
  CmcPriceConversionDto,
  CmcPriceConversionV2Dto,
  CmcPricePerformanceStatsLatestDto,
  CmcPricePerformanceStatsLatestV2Dto,
  CmcToolsPriceConversionV1Dto,
  CmcTrendingGainersLosersV1Dto,
  CmcTrendingLatestV1Dto,
  CmcTrendingMostVisitedV1Dto,
} from '../dto/cmc-base.response.dto';

@Injectable()
export class CmcBaseService implements OnModuleInit {
  private readonly logger = new Logger(CmcBaseService.name);
  private apiClient: Record<string, ApiFunction> = {};

  @ConfigGet('cmc.envType', {
    inferEnvVar: true,
    defaultValue: CmcEnvironmentType.PRODUCTION,
  })
  private readonly envType!: CmcEnvironmentType;

  @ConfigGetOrThrow('cmc.apiKey', { inferEnvVar: true })
  private readonly apiKey!: string;

  @ConfigGet('cmc.enable', {
    inferEnvVar: true,
    defaultValue: CMC_ENABLE,
  })
  private readonly enableFlag!: boolean;

  @ConfigGet('cmc.defaultFiatCurrency', {
    inferEnvVar: true,
    defaultValue: CMC_DEFAULT_FIAT_CURRENCY,
  })
  private readonly defaultFiat!: string;

  constructor(
    private readonly apiGateway: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject('API_GATEWAY_CMC') apiClient?: Record<string, ApiFunction>,
  ) {
    if (apiClient) {
      this.apiClient = apiClient;
    }
  }

  private get isEnabled(): boolean {
    return (
      this.configService.get('cmc.enable', this.enableFlag, { infer: true }) ??
      false
    );
  }

  onModuleInit(): void {
    if (!this.isEnabled) {
      this.logger.warn('CMC base transport is DISABLED. Skipping init.');
      return;
    }

    this.ensureClient();

    const baseUrl = getCmcBaseUrl(this.envType);
    if (baseUrl) {
      this.apiGateway.updateBaseUrl('CMC', baseUrl);
    }

    this.apiGateway.updateHeaders('CMC', {
      Accept: 'application/json',
      'X-CMC_PRO_API_KEY': this.apiKey,
    });

    // Refresh client reference after base URL / headers update
    this.ensureClient(true);
  }

  isReady(): boolean {
    return (
      this.isEnabled &&
      !!this.apiClient &&
      Object.keys(this.apiClient).length > 0
    );
  }

  getDefaultFiat(): string {
    return this.defaultFiat;
  }

  async call<T = unknown>(
    endpointName: string,
    input: RequestInput = {},
  ): Promise<T> {
    if (!this.isEnabled) {
      throw new Error('CMC provider is disabled by configuration');
    }

    this.ensureClient();
    const endpointFn = this.apiClient[endpointName];

    if (typeof endpointFn !== 'function') {
      throw new Error(`Missing CMC endpoint: ${endpointName}`);
    }

    return (await endpointFn(input)) as T;
  }

  // ---------------------------------------------------------------------------
  // Typed helpers (mirror BinanceBaseService style)
  // ---------------------------------------------------------------------------

  async getKeyInfo(): Promise<CmcKeyInfoDto> {
    const data = await this.call('getKeyInfo');
    return this.toDto(CmcKeyInfoDto, data);
  }

  async getGlobalMetricsLatest(
    query: CmcGlobalMetricsQueryDto,
  ): Promise<CmcGlobalMetricsQuotesLatestDto> {
    const data = await this.call('getGlobalMetrics', { query });
    return this.toDto(CmcGlobalMetricsQuotesLatestDto, data);
  }

  async getGlobalMetricsHistorical(
    query: CmcGlobalMetricsHistoricalQueryDto,
  ): Promise<CmcGlobalMetricsQuotesHistoricalDto> {
    const data = await this.call('getGlobalMetricsHistorical', { query });
    return this.toDto(CmcGlobalMetricsQuotesHistoricalDto, data);
  }

  async getFearAndGreedLatest(): Promise<CmcFearAndGreedLatestDto> {
    const data = await this.call('getFearAndGreedLatest');
    return this.toDto(CmcFearAndGreedLatestDto, data);
  }

  async getIndexCmc20Latest(): Promise<CmcIndexCmc20LatestDto> {
    const data = await this.call('getIndexCmc20Latest');
    return this.toDto(CmcIndexCmc20LatestDto, data);
  }

  async getIndexCmc20Historical(): Promise<CmcIndexCmc20HistoricalDto> {
    const data = await this.call('getIndexCmc20Historical');
    return this.toDto(CmcIndexCmc20HistoricalDto, data);
  }

  async getIndexCmc100Latest(): Promise<CmcIndexCmc100LatestDto> {
    const data = await this.call('getIndexCmc100Latest');
    return this.toDto(CmcIndexCmc100LatestDto, data);
  }

  async getIndexCmc100Historical(): Promise<CmcIndexCmc100HistoricalDto> {
    const data = await this.call('getIndexCmc100Historical');
    return this.toDto(CmcIndexCmc100HistoricalDto, data);
  }

  async priceConversionV1(
    query: CmcPriceConversionV1QueryDto,
  ): Promise<CmcToolsPriceConversionV1Dto> {
    const data = await this.call('priceConversionV1', { query });
    return this.toDto(CmcToolsPriceConversionV1Dto, data);
  }

  async priceConversion(
    query: CmcPriceConversionV1QueryDto,
  ): Promise<CmcPriceConversionDto> {
    const data = await this.call('priceConversion', { query });
    return this.toDto(CmcPriceConversionDto, data);
  }

  async priceConversionV2(
    query: CmcPriceConversionV1QueryDto,
  ): Promise<CmcPriceConversionV2Dto> {
    const data = await this.call('priceConversionV2', { query });
    return this.toDto(CmcPriceConversionV2Dto, data);
  }

  async postman(): Promise<CmcPostmanDto> {
    const data = await this.call('postman');
    return this.toDto(CmcPostmanDto, data);
  }

  async getFiatMap(query: CmcFiatMapQueryDto): Promise<CmcFiatMapDto> {
    const data = await this.call('getFiatMap', { query });
    return this.toDto(CmcFiatMapDto, data);
  }

  async getBlockchainStatisticsLatest(
    query: CmcBlockchainStatisticsLatestQueryDto,
  ): Promise<CmcBlockchainStatisticsLatestDto> {
    const data = await this.call('getBlockchainStatisticsLatest', { query });
    return this.toDto(CmcBlockchainStatisticsLatestDto, data);
  }

  async getFearAndGreedHistorical(
    query: CmcFearAndGreedHistoricalQueryDto,
  ): Promise<CmcFearAndGreedHistoricalDto> {
    const data = await this.call('getFearAndGreedHistorical', { query });
    return this.toDto(CmcFearAndGreedHistoricalDto, data);
  }

  async getCryptoMap(query: CmcCryptoMapQueryDto): Promise<CmcCryptoMapV1Dto> {
    const data = await this.call('getCryptoMap', { query });
    return this.toDto(CmcCryptoMapV1Dto, data);
  }

  async getCryptoInfo(
    query: CmcCryptoInfoQueryDto,
  ): Promise<CmcCryptoInfoV1Dto> {
    const data = await this.call('getCryptoInfo', { query });
    return this.toDto(CmcCryptoInfoV1Dto, data);
  }

  async getCryptoInfoV2(
    query: CmcCryptoInfoQueryDto,
  ): Promise<CmcCryptoInfoV2Dto> {
    const data = await this.call('getCryptoInfoV2', { query });
    return this.toDto(CmcCryptoInfoV2Dto, data);
  }

  async getCryptoListingsLatest(
    query: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV1Dto> {
    const data = await this.call('getCryptoListingsLatest', { query });
    return this.toDto(CmcCryptoListingsLatestV1Dto, data);
  }

  async getCryptoListingsHistorical(): Promise<CmcCryptoListingsHistoricalDto> {
    const data = await this.call('getCryptoListingsHistorical');
    return this.toDto(CmcCryptoListingsHistoricalDto, data);
  }

  async getCryptoListingsLatestV3(
    query: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV3Dto> {
    const data = await this.call('getCryptoListingsLatestV3', { query });
    return this.toDto(CmcCryptoListingsLatestV3Dto, data);
  }

  async getQuotesLatest(
    query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV1Dto> {
    const data = await this.call('getQuotesLatest', { query });
    return this.toDto(CmcCryptoQuotesLatestV1Dto, data);
  }

  async getQuotesLatestV2(
    query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV2Dto> {
    const data = await this.call('getQuotesLatestV2', { query });
    return this.toDto(CmcCryptoQuotesLatestV2Dto, data);
  }

  async getQuotesLatestV3(
    query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV3Dto> {
    const data = await this.call('getQuotesLatestV3', { query });
    return this.toDto(CmcCryptoQuotesLatestV3Dto, data);
  }

  async getQuotesHistorical(
    query: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV1Dto> {
    const data = await this.call('getQuotesHistorical', { query });
    return this.toDto(CmcCryptoQuotesHistoricalV1Dto, data);
  }

  async getQuotesHistoricalV2(
    query: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV2Dto> {
    const data = await this.call('getQuotesHistoricalV2', { query });
    return this.toDto(CmcCryptoQuotesHistoricalV2Dto, data);
  }

  async getQuotesHistoricalV3(
    query: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV3Dto> {
    const data = await this.call('getQuotesHistoricalV3', { query });
    return this.toDto(CmcCryptoQuotesHistoricalV3Dto, data);
  }

  async getOhlcvLatest(
    query: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV1Dto> {
    const data = await this.call('getOhlcvLatest', { query });
    return this.toDto(CmcCryptoOhlcvLatestV1Dto, data);
  }

  async getOhlcvLatestV2(
    query: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV2Dto> {
    const data = await this.call('getOhlcvLatestV2', { query });
    return this.toDto(CmcCryptoOhlcvLatestV2Dto, data);
  }

  async getOhlcvHistorical(
    query: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV1Dto> {
    const data = await this.call('getOhlcvHistorical', { query });
    return this.toDto(CmcCryptoOhlcvHistoricalV1Dto, data);
  }

  async getOhlcvHistoricalV2(
    query: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV2Dto> {
    const data = await this.call('getOhlcvHistoricalV2', { query });
    return this.toDto(CmcCryptoOhlcvHistoricalV2Dto, data);
  }

  async getMarketPairsLatest(
    query: CmcCryptoMarketPairsLatestV1QueryDto,
  ): Promise<CmcCryptoMarketPairsLatestV1Dto> {
    const data = await this.call('getMarketPairsLatest', { query });
    return this.toDto(CmcCryptoMarketPairsLatestV1Dto, data);
  }

  async getMarketPairsLatestV2(
    query: CmcCryptoMarketPairsLatestV1QueryDto,
  ): Promise<CmcCryptoMarketPairsLatestV2Dto> {
    const data = await this.call('getMarketPairsLatestV2', { query });
    return this.toDto(CmcCryptoMarketPairsLatestV2Dto, data);
  }

  async getTrendingLatest(
    query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingLatestV1Dto> {
    const data = await this.call('getTrendingLatest', { query });
    return this.toDto(CmcTrendingLatestV1Dto, data);
  }

  async getTrendingMostVisited(
    query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingMostVisitedV1Dto> {
    const data = await this.call('getTrendingMostVisited', { query });
    return this.toDto(CmcTrendingMostVisitedV1Dto, data);
  }

  async getTrendingGainersLosers(
    query: CmcTrendingQueryDto,
  ): Promise<CmcTrendingGainersLosersV1Dto> {
    const data = await this.call('getTrendingGainersLosers', { query });
    return this.toDto(CmcTrendingGainersLosersV1Dto, data);
  }

  async getPricePerformanceStatsLatest(
    query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcPricePerformanceStatsLatestDto> {
    const data = await this.call('getPricePerformanceStatsLatest', { query });
    return this.toDto(CmcPricePerformanceStatsLatestDto, data);
  }

  async getPricePerformanceStatsLatestV2(
    query: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcPricePerformanceStatsLatestV2Dto> {
    const data = await this.call('getPricePerformanceStatsLatestV2', { query });
    return this.toDto(CmcPricePerformanceStatsLatestV2Dto, data);
  }

  async getCategories(): Promise<CmcCategoriesDto> {
    const data = await this.call('getCategories');
    return this.toDto(CmcCategoriesDto, data);
  }

  async getCategory(): Promise<CmcCategoryDto> {
    const data = await this.call('getCategory');
    return this.toDto(CmcCategoryDto, data);
  }

  async getAirdrops(): Promise<CmcAirdropsDto> {
    const data = await this.call('getAirdrops');
    return this.toDto(CmcAirdropsDto, data);
  }

  async getAirdrop(): Promise<CmcAirdropDto> {
    const data = await this.call('getAirdrop');
    return this.toDto(CmcAirdropDto, data);
  }

  async getExchangeMap(
    query: CmcExchangeMapQueryDto,
  ): Promise<CmcExchangeMapDto> {
    const data = await this.call('getExchangeMap', { query });
    return this.toDto(CmcExchangeMapDto, data);
  }

  async getExchangeInfo(
    query: CmcExchangeInfoQueryDto,
  ): Promise<CmcExchangeInfoDto> {
    const data = await this.call('getExchangeInfo', { query });
    return this.toDto(CmcExchangeInfoDto, data);
  }

  async getExchangeQuotesLatest(
    query: CmcExchangeQuotesLatestQueryDto,
  ): Promise<CmcExchangeQuotesLatestDto> {
    const data = await this.call('getExchangeQuotesLatest', { query });
    return this.toDto(CmcExchangeQuotesLatestDto, data);
  }

  async getExchangeMarketPairsLatest(
    query: CmcExchangeMarketPairsLatestQueryDto,
  ): Promise<CmcExchangeMarketPairsLatestDto> {
    const data = await this.call('getExchangeMarketPairsLatest', { query });
    return this.toDto(CmcExchangeMarketPairsLatestDto, data);
  }

  async getExchangeListingsLatest(
    query: CmcExchangeListingsLatestQueryDto,
  ): Promise<CmcExchangeListingsLatestDto> {
    const data = await this.call('getExchangeListingsLatest', { query });
    return this.toDto(CmcExchangeListingsLatestDto, data);
  }

  async getExchangeQuotesHistorical(
    query: CmcExchangeQuotesHistoricalQueryDto,
  ): Promise<CmcExchangeQuotesHistoricalDto> {
    const data = await this.call('getExchangeQuotesHistorical', { query });
    return this.toDto(CmcExchangeQuotesHistoricalDto, data);
  }

  async getExchangeAssets(): Promise<CmcExchangeAssetsDto> {
    const data = await this.call('getExchangeAssets');
    return this.toDto(CmcExchangeAssetsDto, data);
  }

  private ensureClient(forceRefresh = false): void {
    if (
      forceRefresh ||
      !this.apiClient ||
      Object.keys(this.apiClient).length === 0
    ) {
      this.apiClient = this.apiGateway.getClient('CMC');
    }
  }

  private toDto<T>(cls: new () => T, data: any): T {
    return plainToInstance(cls, data as object);
  }
}
