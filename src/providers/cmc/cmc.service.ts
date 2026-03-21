import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { BaseToggleableService } from 'src/common/base/base-toggleable.service';
import { CMC_DEFAULT_FIAT_CURRENCY, CMC_ENABLE } from './types/cmc-const.type';
import { ConfigGet } from '../../config/config.decorator';
import { RoleEnum } from 'src/roles/roles.enum';
import { GroupPlainToInstance } from 'src/utils/transformers/class.transformer';
import { CmcBaseService } from './services/cmc-base.service';

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
  CmcCryptoInfoV2Dto,
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
  CmcCryptoQuotesLatestV1Dto,
  CmcCryptoQuotesLatestV3Dto,
  CmcTrendingGainersLosersV1Dto,
  CmcTrendingLatestV1Dto,
  CmcTrendingMostVisitedV1Dto,
} from './dto/cmc-cryptocurrency.dto';

@Injectable()
export class CmcService extends BaseToggleableService implements OnModuleInit {
  static readonly displayName = 'CoinMarketCap';

  @ConfigGet('cmc.defaultFiatCurrency', {
    inferEnvVar: true,
    defaultValue: CMC_DEFAULT_FIAT_CURRENCY,
  })
  private readonly defaultFiat!: string;

  constructor(
    private readonly baseService: CmcBaseService,
    private readonly configService: ConfigService<AllConfigType>,
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

  // ---------------------------------------------------------------------------
  // Key / Plan usage
  // ---------------------------------------------------------------------------
  async getKeyInfo(): Promise<CmcKeyInfoDto> {
    const payload = await this.baseService.call('getKeyInfo');
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

    const payload = await this.baseService.call('getGlobalMetrics', {
      query: dto,
    });
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

    const payload = await this.baseService.call('getGlobalMetricsHistorical', {
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

    const payload = await this.baseService.call('priceConversionV1', {
      query: dto,
    });
    return GroupPlainToInstance(CmcToolsPriceConversionV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Fiat
  // ---------------------------------------------------------------------------
  async getFiatMap(q: CmcFiatMapQueryDto): Promise<CmcFiatMapDto> {
    const payload = await this.baseService.call('getFiatMap', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcFiatMapDto, payload, [RoleEnum.admin]);
  }

  // ---------------------------------------------------------------------------
  // Blockchain
  // ---------------------------------------------------------------------------
  async getBlockchainStatisticsLatest(
    q: CmcBlockchainStatisticsLatestQueryDto,
  ): Promise<CmcBlockchainStatisticsLatestDto> {
    const payload = await this.baseService.call(
      'getBlockchainStatisticsLatest',
      {
        query: q ?? {},
      },
    );
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
    const payload = await this.baseService.call('getFearAndGreedHistorical', {
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
    const payload = await this.baseService.call('getCryptoMap', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcCryptoMapV1Dto, payload, [RoleEnum.admin]);
  }

  async getCryptoInfo(q: CmcCryptoInfoQueryDto): Promise<CmcCryptoInfoV1Dto> {
    const payload = await this.baseService.call('getCryptoInfo', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcCryptoInfoV1Dto, payload, [RoleEnum.admin]);
  }

  async getCryptoInfoV2(q: CmcCryptoInfoQueryDto): Promise<CmcCryptoInfoV2Dto> {
    const payload = await this.baseService.call('getCryptoInfoV2', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcCryptoInfoV2Dto, payload, [RoleEnum.admin]);
  }

  async getCryptoListingsLatest(
    q: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getCryptoListingsLatest', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoListingsLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getCryptoListingsLatestV3(
    q: CmcCryptoListingsLatestQueryDto,
  ): Promise<CmcCryptoListingsLatestV3Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getCryptoListingsLatestV3', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoListingsLatestV3Dto, payload, [
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

    const payload = await this.baseService.call('getQuotesLatest', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoQuotesLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getQuotesLatestV3(
    q: CmcCryptoQuotesLatestV1QueryDto,
  ): Promise<CmcCryptoQuotesLatestV3Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getQuotesLatestV3', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoQuotesLatestV3Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getQuotesHistorical(
    q: CmcCryptoQuotesHistoricalV1QueryDto,
  ): Promise<CmcCryptoQuotesHistoricalV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getQuotesHistorical', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoQuotesHistoricalV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvLatest(
    q: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getOhlcvLatest', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoOhlcvLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvLatestV2(
    q: CmcCryptoOhlcvLatestV1QueryDto,
  ): Promise<CmcCryptoOhlcvLatestV2Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getOhlcvLatestV2', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoOhlcvLatestV2Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvHistorical(
    q: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV1Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getOhlcvHistorical', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoOhlcvHistoricalV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getOhlcvHistoricalV2(
    q: CmcCryptoOhlcvHistoricalV1QueryDto,
  ): Promise<CmcCryptoOhlcvHistoricalV2Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getOhlcvHistoricalV2', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoOhlcvHistoricalV2Dto, payload, [
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

    const payload = await this.baseService.call('getMarketPairsLatest', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoMarketPairsLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getMarketPairsLatestV2(
    q: CmcCryptoMarketPairsLatestV1QueryDto,
  ): Promise<CmcCryptoMarketPairsLatestV2Dto> {
    const dto: any = { ...(q ?? {}) };
    if (!dto.convert) dto.convert = this.defaultFiat;

    const payload = await this.baseService.call('getMarketPairsLatestV2', {
      query: dto,
    });
    return GroupPlainToInstance(CmcCryptoMarketPairsLatestV2Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  // ---------------------------------------------------------------------------
  // Cryptocurrency - Trending
  // ---------------------------------------------------------------------------
  async getTrendingLatest(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingLatestV1Dto> {
    const payload = await this.baseService.call('getTrendingLatest', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcTrendingLatestV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getTrendingMostVisited(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingMostVisitedV1Dto> {
    const payload = await this.baseService.call('getTrendingMostVisited', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcTrendingMostVisitedV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }

  async getTrendingGainersLosers(
    q: CmcTrendingQueryDto,
  ): Promise<CmcTrendingGainersLosersV1Dto> {
    const payload = await this.baseService.call('getTrendingGainersLosers', {
      query: q ?? {},
    });
    return GroupPlainToInstance(CmcTrendingGainersLosersV1Dto, payload, [
      RoleEnum.admin,
    ]);
  }
}
