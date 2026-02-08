import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { ApiGatewayService } from 'src/common/api-gateway/api-gateway.service';
import { ApiFunction } from 'src/common/api-gateway/types/api-gateway.type';
import { BaseToggleableService } from 'src/common/base/base-toggleable.service';
import { getCmcBaseUrl } from './cmc.helper';
import { CMC_DEFAULT_FIAT_CURRENCY, CMC_ENABLE } from './types/cmc-const.type';
import { ConfigGet, ConfigGetOrThrow } from '../../config/config.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { GroupPlainToInstance } from 'src/utils/transformers/class.transformer';

// DTOs
import { CmcKeyInfoDto } from './dto/cmc-info.dto';
import {
  CmcBlockchainStatisticsLatestQueryDto,
  CmcCryptoInfoQueryDto,
  CmcCryptoListingsLatestQueryDto,
  CmcCryptoMapQueryDto,
  CmcCryptoMarketPairsLatestV1QueryDto,
  CmcCryptoOhlcvHistoricalV1QueryDto,
  CmcCryptoOhlcvLatestV1QueryDto,
  CmcCryptoQuotesHistoricalV1QueryDto,
  CmcCryptoQuotesLatestV1QueryDto,
  CmcFearAndGreedHistoricalQueryDto,
  CmcFiatMapQueryDto,
  CmcGlobalMetricsHistoricalQueryDto,
  CmcGlobalMetricsQueryDto,
  CmcPriceConversionV1QueryDto,
  CmcTrendingQueryDto,
} from './dto/cmc-base.query.dto';
import {
  CmcGlobalMetricsQuotesHistoricalDto,
  CmcGlobalMetricsQuotesLatestDto,
} from './dto/cmc-global-metrics.dto';
import { CmcToolsPriceConversionV1Dto } from './dto/cmc-tools.dto';
import { CmcFiatMapDto } from './dto/cmc-fiat.dto';
import { CmcBlockchainStatisticsLatestDto } from './dto/cmc-blockchain.dto';
import { CmcFearAndGreedHistoricalDto } from './dto/cmc-fear-and-greed.dto';
import {
  CmcCryptoInfoV1Dto,
  CmcCryptoListingsLatestV1Dto,
  CmcCryptoMapV1Dto,
  CmcCryptoMarketPairsLatestV1Dto,
  CmcCryptoOhlcvHistoricalV1Dto,
  CmcCryptoOhlcvLatestV1Dto,
  CmcCryptoQuotesHistoricalV1Dto,
  CmcCryptoQuotesLatestV1Dto,
  CmcTrendingGainersLosersV1Dto,
  CmcTrendingLatestV1Dto,
  CmcTrendingMostVisitedV1Dto,
} from './dto/cmc-cryptocurrency.dto';
import { CmcEnvironmentType } from './types/cmc-enum.type';

@Injectable()
export class CmcService extends BaseToggleableService implements OnModuleInit {
  static readonly displayName = 'CoinMarketCap';

  private apiClient: Record<string, ApiFunction> = {};
  private baseUrl = '';

  @ConfigGet('cmc.envType', {
    inferEnvVar: true,
    defaultValue: CmcEnvironmentType.PRODUCTION,
  })
  private readonly envType!: CmcEnvironmentType;

  @ConfigGetOrThrow('cmc.apiKey', { inferEnvVar: true })
  private readonly apiKey!: string;

  @ConfigGet('cmc.defaultFiatCurrency', {
    inferEnvVar: true,
    defaultValue: CMC_DEFAULT_FIAT_CURRENCY,
  })
  private readonly defaultFiat!: string;

  constructor(
    private readonly apiSdkService: ApiGatewayService,
    private readonly configService: ConfigService<AllConfigType>,
    @Inject('API_GATEWAY_CMC') apiClient?: Record<string, ApiFunction>,
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
    if (apiClient) this.apiClient = apiClient;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.warn('CMC service is DISABLED. Skipping initialization.');
      return;
    }

    if (!this.apiClient || Object.keys(this.apiClient).length === 0) {
      this.apiClient = this.apiSdkService.getClient('CMC');
    }
    if (!this.apiClient) {
      this.logger.error('CMC API client is not initialized.');
      return;
    }

    this.baseUrl = getCmcBaseUrl(this.envType);
    if (this.baseUrl) {
      this.apiSdkService.updateBaseUrl('CMC', this.baseUrl);
      this.apiClient = this.apiSdkService.getClient('CMC');
    }
    this.apiSdkService.updateHeaders('CMC', {
      Accept: 'application/json',
      'X-CMC_PRO_API_KEY': this.apiKey,
    });
    // Refresh client reference so we use the rebuilt instance that includes the API key header
    this.apiClient = this.apiSdkService.getClient('CMC');

    await this.checkConnection();
  }

  /** Returns true when the service is enabled and a client is available. */
  public isReady(): boolean {
    return this.isEnabled && !!this.apiClient;
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.getKeyInfo();
      this.logger.log('CMC connection is OK.');
    } catch (e: any) {
      this.logger.warn(`CMC connectivity check failed: ${e?.message || e}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Key / Plan usage
  // ---------------------------------------------------------------------------
  async getKeyInfo(): Promise<CmcKeyInfoDto> {
    const payload = await this.apiClient.getKeyInfo();
    return GroupPlainToInstance(CmcKeyInfoDto, payload, [RoleEnum.admin]);
  }

  // ---------------------------------------------------------------------------
  // Global Metrics
  // ---------------------------------------------------------------------------
  async getGlobalMetricsLatest(
    q: CmcGlobalMetricsQueryDto,
  ): Promise<CmcGlobalMetricsQuotesLatestDto> {
    const dto: any = { ...(q ?? {}) };

    // CMC API rule: you cannot send both 'convert' and 'convert_id' at the same time.
    // If 'convert_id' is provided, we remove 'convert' to avoid a 400 Bad Request.
    if (dto.convert_id) {
      delete dto.convert;
    } else if (!dto.convert) {
      dto.convert = this.defaultFiat; // Apply default fiat when neither is provided
    }

    const payload = await this.apiClient.getGlobalMetrics({ query: dto });
    return GroupPlainToInstance(CmcGlobalMetricsQuotesLatestDto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getGlobalMetricsHistorical(
    q: CmcGlobalMetricsHistoricalQueryDto,
  ): Promise<CmcGlobalMetricsQuotesHistoricalDto> {
    const dto: any = { ...(q ?? {}) };

    // CMC API rule: you cannot send both 'convert' and 'convert_id' at the same time.
    // If 'convert_id' is provided, we remove 'convert' to avoid a 400 Bad Request.
    if (dto.convert_id) {
      delete dto.convert;
    } else if (!dto.convert) {
      dto.convert = this.defaultFiat; // Apply default fiat when neither is provided
    }

    const payload = await this.apiClient.getGlobalMetricsHistorical({
      query: dto,
    });
    return GroupPlainToInstance(CmcGlobalMetricsQuotesHistoricalDto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------
  async priceConversionV1(
    q: CmcPriceConversionV1QueryDto,
  ): Promise<CmcToolsPriceConversionV1Dto> {
    const dto: any = { ...(q ?? {}) };

    if (dto.convert_id) {
      delete dto.convert;
    } else if (!dto.convert) {
      dto.convert = this.defaultFiat;
    }

    const payload = await this.apiClient.priceConversionV1({ query: dto });
    return GroupPlainToInstance(CmcToolsPriceConversionV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Fiat
  // ---------------------------------------------------------------------------
  async getFiatMap(q: CmcFiatMapQueryDto): Promise<CmcFiatMapDto> {
    const payload = await this.apiClient.getFiatMap({ query: q ?? {} });
    return GroupPlainToInstance(CmcFiatMapDto, payload, [RoleEnum.admin]);
  }

  // ---------------------------------------------------------------------------
  // Blockchain
  // ---------------------------------------------------------------------------
  async getBlockchainStatisticsLatest(
    q: CmcBlockchainStatisticsLatestQueryDto,
  ): Promise<CmcBlockchainStatisticsLatestDto> {
    const payload = await this.apiClient.getBlockchainStatisticsLatest({
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcBlockchainStatisticsLatestDto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Fear & Greed
  // ---------------------------------------------------------------------------
  async getFearAndGreedHistorical(
    q: CmcFearAndGreedHistoricalQueryDto,
  ): Promise<CmcFearAndGreedHistoricalDto> {
    const payload = await this.apiClient.getFearAndGreedHistorical({
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcFearAndGreedHistoricalDto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Assets and lists
  // ---------------------------------------------------------------------------
  async getCryptoMap(q: CmcCryptoMapQueryDto): Promise<CmcCryptoMapV1Dto> {
    const payload = await this.apiClient.getCryptoMap({ query: q ?? {} });
    return GroupPlainToInstance(CmcCryptoMapV1Dto, payload, [RoleEnum.admin]);
  }

  async getCryptoInfo(q: CmcCryptoInfoQueryDto): Promise<CmcCryptoInfoV1Dto> {
    const payload = await this.apiClient.getCryptoInfo({ query: q ?? {} });
    return GroupPlainToInstance(CmcCryptoInfoV1Dto, payload, [RoleEnum.admin]);
  }

  async getCryptoListingsLatest(
    q: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getCryptoListingsLatest({
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoListingsLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Quotes and OHLCV
  // ---------------------------------------------------------------------------
  async getQuotesLatest(
    q: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getQuotesLatest({ query: dto });
    return GroupPlainToInstance(CmcCryptoQuotesLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getQuotesHistorical(
    q: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getQuotesHistorical({ query: dto });
    return GroupPlainToInstance(CmcCryptoQuotesHistoricalV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvLatest(
    q: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getOhlcvLatest({ query: dto });
    return GroupPlainToInstance(CmcCryptoOhlcvLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvHistorical(
    q: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getOhlcvHistorical({ query: dto });
    return GroupPlainToInstance(CmcCryptoOhlcvHistoricalV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Market pairs
  // ---------------------------------------------------------------------------
  async getMarketPairsLatest(
    q: CmcCryptoMarketPairsLatestV1QueryDto,
  ): Promise<CmcCryptoMarketPairsLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.apiClient.getMarketPairsLatest({ query: dto });
    return GroupPlainToInstance(CmcCryptoMarketPairsLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Trending
  // ---------------------------------------------------------------------------
  async getTrendingLatest(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingLatestV1Dto> {
    const payload = await this.apiClient.getTrendingLatest({ query: q ?? {} });
    return GroupPlainToInstance(CmcTrendingLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getTrendingMostVisited(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingMostVisitedV1Dto> {
    const payload = await this.apiClient.getTrendingMostVisited({
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcTrendingMostVisitedV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getTrendingGainersLosers(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingGainersLosersV1Dto> {
    const payload = await this.apiClient.getTrendingGainersLosers({
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcTrendingGainersLosersV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }
}
