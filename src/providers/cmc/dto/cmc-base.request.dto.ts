// -----------------------------------------------------------------------------
// CoinMarketCap - Base request DTOs (thin wrappers around query DTOs)
// Mirrors the Binance provider structure for consistency.
// -----------------------------------------------------------------------------

import { Exclude } from 'class-transformer';
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
} from './cmc-base.query.dto';

@Exclude()
export class CmcKeyInfoRequestDto {}

@Exclude()
export class CmcGlobalMetricsLatestRequestDto extends CmcGlobalMetricsQueryDto {}

@Exclude()
export class CmcGlobalMetricsHistoricalRequestDto extends CmcGlobalMetricsHistoricalQueryDto {}

@Exclude()
export class CmcPriceConversionRequestDto extends CmcPriceConversionV1QueryDto {}

@Exclude()
export class CmcFiatMapRequestDto extends CmcFiatMapQueryDto {}

@Exclude()
export class CmcBlockchainStatisticsLatestRequestDto extends CmcBlockchainStatisticsLatestQueryDto {}

@Exclude()
export class CmcFearAndGreedHistoricalRequestDto extends CmcFearAndGreedHistoricalQueryDto {}

@Exclude()
export class CmcCryptoMapRequestDto extends CmcCryptoMapQueryDto {}

@Exclude()
export class CmcCryptoInfoRequestDto extends CmcCryptoInfoQueryDto {}

@Exclude()
export class CmcCryptoInfoV2RequestDto extends CmcCryptoInfoQueryDto {}

@Exclude()
export class CmcCryptoListingsLatestRequestDto extends CmcCryptoListingsLatestQueryDto {}

@Exclude()
export class CmcCryptoQuotesLatestRequestDto extends CmcCryptoQuotesLatestV1QueryDto {}

@Exclude()
export class CmcCryptoQuotesHistoricalRequestDto extends CmcCryptoQuotesHistoricalV1QueryDto {}

@Exclude()
export class CmcCryptoOhlcvLatestRequestDto extends CmcCryptoOhlcvLatestV1QueryDto {}

@Exclude()
export class CmcCryptoOhlcvHistoricalRequestDto extends CmcCryptoOhlcvHistoricalV1QueryDto {}

@Exclude()
export class CmcCryptoMarketPairsLatestRequestDto extends CmcCryptoMarketPairsLatestV1QueryDto {}

@Exclude()
export class CmcTrendingRequestDto extends CmcTrendingQueryDto {}
