// src/providers/cmc/dto/cmc-query.dto.ts
// -----------------------------------------------------------------------------
// CoinMarketCap - Query DTOs (composed with inheritance for reuse)
// -----------------------------------------------------------------------------

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import {
  CmcCryptocurrencyType,
  CmcCryptoListingsSort,
  CmcCryptoMapSort,
  CmcListingStatus,
  CmcSortDirection,
} from '../types/cmc-enum.type';
import { defaultStringTransformer } from '../../../utils/transformers/string.transformer';
import {
  numberTransformer,
  optionalNumberTransformer,
} from '../../../utils/transformers/number.transformer';

// -----------------------------------------------------------------------------
// Shared fragments
// -----------------------------------------------------------------------------

@Exclude()
export class CmcPagingQueryDto {
  @ApiPropertyOptional({
    description: 'Pagination start (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  start?: number;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 100,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  limit?: number;
}

@Exclude()
export class CmcIdSymbolQueryDto {
  @ApiPropertyOptional({
    description: 'CSV of CMC IDs (e.g., 1,1027)',
    example: '1,1027',
  })
  @IsOptional()
  @IsString()
  @Expose()
  id?: string;

  @ApiPropertyOptional({
    description: 'CSV of symbols (e.g., BTC,ETH)',
    example: 'BTC,ETH',
  })
  @IsOptional()
  @IsString()
  @Expose()
  symbol?: string;

  @ApiPropertyOptional({
    description: 'CSV of slugs (e.g., bitcoin,ethereum)',
    example: 'bitcoin,ethereum',
  })
  @IsOptional()
  @IsString()
  @Expose()
  slug?: string;
}

@Exclude()
export class CmcConvertQueryDto {
  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD,EUR',
  })
  @Transform(defaultStringTransformer('USD'), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;

  @ApiPropertyOptional({
    description: 'Convert to these IDs (CSV)',
    example: '2781',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert_id?: string;
}

@Exclude()
export class CmcTimeRangeQueryDto {
  @ApiPropertyOptional({
    description: 'Start time (ISO8601 or UNIX seconds)',
    example: '2019-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_start?: string;

  @ApiPropertyOptional({
    description: 'End time (ISO8601 or UNIX seconds)',
    example: '2019-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_end?: string;

  @ApiPropertyOptional({
    description: 'Interval (e.g., 1m,5m,15m,1h,4h,1d,1w)',
    example: '1d',
    pattern: '^\\d+[mhdw]$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+[mhdw]$/)
  @Expose()
  interval?: string;
}

@Exclude()
export class CmcCountQueryDto {
  @ApiPropertyOptional({
    description: 'Number of data points to return (when interval is used)',
    example: 100,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  count?: number;
}

@Exclude()
export class CmcAuxQueryDto {
  @ApiPropertyOptional({
    description: 'CSV of optional fields to include',
    example: 'platform,notice,tags',
  })
  @IsOptional()
  @IsString()
  @Expose()
  aux?: string;
}

@Exclude()
export class CmcSortDirQueryDto {
  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: CmcSortDirection,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(CmcSortDirection)
  @Expose()
  sort_dir?: CmcSortDirection;
}

@Exclude()
export class CmcLimitOnlyQueryDto {
  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 10,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  limit?: number;
}

// Trending (used directly by controller already)
@Exclude()
export class CmcTrendingQueryDto {
  @ApiPropertyOptional({
    description: 'Offset for paginated results',
    example: 1,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  start?: number;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 10,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Convert to this symbol(s)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;
}

// -----------------------------------------------------------------------------
// Exchange
// -----------------------------------------------------------------------------

@Exclude()
export class CmcExchangeMapQueryDto extends CmcPagingQueryDto {
  @ApiPropertyOptional({
    description: 'CSV of slugs to filter',
    example: 'binance,kraken',
  })
  @IsOptional()
  @IsString()
  @Expose()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Listing status filter (e.g., active,inactive)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  @Expose()
  listing_status?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'id',
  })
  @IsOptional()
  @IsString()
  @Expose()
  sort?: string;
}

@Exclude()
export class CmcExchangeInfoQueryDto {
  @ApiPropertyOptional({ description: 'CSV of exchange IDs', example: '270' })
  @IsOptional()
  @IsString()
  @Expose()
  id?: string;

  @ApiPropertyOptional({
    description: 'CSV of exchange slugs',
    example: 'binance,kraken',
  })
  @IsOptional()
  @IsString()
  @Expose()
  slug?: string;
}

@Exclude()
export class CmcExchangeQuotesLatestQueryDto extends CmcExchangeInfoQueryDto {
  @ApiPropertyOptional({
    description: 'Convert results to these symbols (CSV)',
    example: 'USD,EUR',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;

  @ApiPropertyOptional({
    description: 'Convert by currency IDs (CSV)',
    example: '2781',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert_id?: string;
}

@Exclude()
export class CmcExchangeMarketPairsLatestQueryDto
  extends CmcExchangeQuotesLatestQueryDto
  implements Partial<CmcPagingQueryDto>
{
  @ApiPropertyOptional({
    description: 'Pagination start (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  start?: number;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    example: 100,
    minimum: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  limit?: number;
}

@Exclude()
export class CmcExchangeListingsLatestQueryDto extends CmcExchangeInfoQueryDto {
  @ApiPropertyOptional({
    description: 'Start offset (1-indexed)',
    example: 1,
  })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  start?: number;

  @ApiPropertyOptional({ description: 'Limit', example: 100 })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  limit?: number;
}

@Exclude()
export class CmcExchangeQuotesHistoricalQueryDto extends CmcExchangeQuotesLatestQueryDto {}

// -----------------------------------------------------------------------------
// Global Metrics
// -----------------------------------------------------------------------------

@Exclude()
export class CmcGlobalMetricsQueryDto extends CmcConvertQueryDto {}

@Exclude()
export class CmcGlobalMetricsHistoricalQueryDto
  extends CmcConvertQueryDto
  implements Partial<CmcTimeRangeQueryDto>, Partial<CmcCountQueryDto>
{
  @ApiPropertyOptional({
    description: 'Start time (ISO/UNIX)',
    example: '2019-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_start?: string;

  @ApiPropertyOptional({
    description: 'End time (ISO/UNIX)',
    example: '2019-02-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_end?: string;

  @ApiPropertyOptional({ description: 'Interval (e.g., 1d,1w)', example: '1d' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+[mhdw]$/)
  @Expose()
  interval?: string;

  @ApiPropertyOptional({ description: 'Number of points', example: 100 })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  count?: number;
}

// -----------------------------------------------------------------------------
// Tools - Price Conversion
// -----------------------------------------------------------------------------

@Exclude()
export class CmcPriceConversionBaseQueryDto extends CmcConvertQueryDto {
  @ApiProperty({ description: 'Amount to convert', example: 1.23 })
  @Transform(numberTransformer)
  @IsNumber()
  @Expose()
  amount!: number;

  @ApiPropertyOptional({ description: 'Source CMC Id(s) (CSV)', example: '1' })
  @IsOptional()
  @IsString()
  @Expose()
  id?: string;

  @ApiPropertyOptional({
    description: 'Source symbol(s) (CSV)',
    example: 'BTC',
  })
  @IsOptional()
  @IsString()
  @Expose()
  symbol?: string;
}

@Exclude()
export class CmcPriceConversionV1QueryDto extends CmcPriceConversionBaseQueryDto {}

// -----------------------------------------------------------------------------
// Fiat
// -----------------------------------------------------------------------------

@Exclude()
export class CmcFiatMapQueryDto extends CmcPagingQueryDto {}

// -----------------------------------------------------------------------------
// Blockchain
// -----------------------------------------------------------------------------

@Exclude()
export class CmcBlockchainStatisticsLatestQueryDto extends CmcIdSymbolQueryDto {}

// -----------------------------------------------------------------------------
// Fear & Greed
// -----------------------------------------------------------------------------

@Exclude()
export class CmcFearAndGreedHistoricalQueryDto extends CmcLimitOnlyQueryDto {
  @ApiPropertyOptional({
    description: 'Start time (ISO or UNIX seconds)',
    example: '2023-01-01',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_start?: string;

  @ApiPropertyOptional({
    description: 'End time (ISO or UNIX seconds)',
    example: '2023-12-31',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_end?: string;
}

// -----------------------------------------------------------------------------
// Cryptocurrency (v1)
// -----------------------------------------------------------------------------

@Exclude()
export class CmcCryptoMapQueryDto
  extends CmcPagingQueryDto
  implements Partial<CmcAuxQueryDto>
{
  @ApiPropertyOptional({
    description: 'Listing status',
    enum: CmcListingStatus,
  })
  @IsOptional()
  @IsEnum(CmcListingStatus)
  @Expose()
  listing_status?: CmcListingStatus;

  @ApiPropertyOptional({
    description: 'Sort by',
    enum: CmcCryptoMapSort,
  })
  @IsOptional()
  @IsEnum(CmcCryptoMapSort)
  @Expose()
  sort?: CmcCryptoMapSort;

  @ApiPropertyOptional({
    description: 'Filter by symbols (CSV)',
    example: 'BTC,ETH',
  })
  @IsOptional()
  @IsString()
  @Expose()
  symbol?: string;

  @ApiPropertyOptional({
    description: 'Aux fields CSV',
    example: 'platform,notice',
  })
  @IsOptional()
  @IsString()
  @Expose()
  aux?: string;
}

@Exclude()
export class CmcCryptoInfoQueryDto extends CmcIdSymbolQueryDto {}

@Exclude()
export class CmcCryptoListingsLatestQueryDto
  extends CmcPagingQueryDto
  implements Partial<CmcConvertQueryDto>, Partial<CmcSortDirQueryDto>
{
  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: CmcCryptoListingsSort,
  })
  @IsOptional()
  @IsEnum(CmcCryptoListingsSort)
  @Expose()
  sort?: CmcCryptoListingsSort;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: CmcSortDirection,
    example: 'desc',
  })
  @IsOptional()
  @IsEnum(CmcSortDirection)
  @Expose()
  sort_dir?: CmcSortDirection;

  @ApiPropertyOptional({
    description: 'Type',
    enum: CmcCryptocurrencyType,
    example: 'all',
  })
  @IsOptional()
  @IsEnum(CmcCryptocurrencyType)
  @Expose()
  cryptocurrency_type?: CmcCryptocurrencyType;
}

@Exclude()
export class CmcCryptoQuotesLatestV1QueryDto
  extends CmcIdSymbolQueryDto
  implements Partial<CmcConvertQueryDto>
{
  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;
}

@Exclude()
export class CmcCryptoQuotesHistoricalV1QueryDto
  extends CmcIdSymbolQueryDto
  implements
    Partial<CmcConvertQueryDto>,
    Partial<CmcTimeRangeQueryDto>,
    Partial<CmcCountQueryDto>
{
  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;

  @ApiPropertyOptional({
    description: 'Start time (ISO/UNIX)',
    example: '2020-01-01',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_start?: string;

  @ApiPropertyOptional({
    description: 'End time (ISO/UNIX)',
    example: '2020-06-01',
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_end?: string;

  @ApiPropertyOptional({ description: 'Interval', example: '1d' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+[mhdw]$/)
  @Expose()
  interval?: string;

  @ApiPropertyOptional({ description: 'Number of points', example: 100 })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  count?: number;
}

@Exclude()
export class CmcCryptoMarketPairsLatestV1QueryDto
  extends CmcPagingQueryDto
  implements Partial<CmcConvertQueryDto>
{
  @ApiPropertyOptional({
    description: 'Crypto Id(s) to fetch pairs for (CSV)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  @Expose()
  id?: string;

  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;
}

@Exclude()
export class CmcCryptoOhlcvLatestV1QueryDto
  extends CmcIdSymbolQueryDto
  implements Partial<CmcConvertQueryDto>
{
  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;
}

@Exclude()
export class CmcCryptoOhlcvHistoricalV1QueryDto
  extends CmcIdSymbolQueryDto
  implements
    Partial<CmcConvertQueryDto>,
    Partial<CmcTimeRangeQueryDto>,
    Partial<CmcCountQueryDto>
{
  @ApiPropertyOptional({
    description: 'Time period granularity',
    example: 'daily',
    enum: ['daily', 'hourly'],
  })
  @IsOptional()
  @IsString()
  @Expose()
  time_period?: string;

  @ApiPropertyOptional({
    description: 'Convert to these symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  @Expose()
  convert?: string;

  @ApiPropertyOptional({ description: 'Start time', example: '2019-01-01' })
  @IsOptional()
  @IsString()
  @Expose()
  time_start?: string;

  @ApiPropertyOptional({ description: 'End time', example: '2019-02-01' })
  @IsOptional()
  @IsString()
  @Expose()
  time_end?: string;

  @ApiPropertyOptional({ description: 'Interval', example: '1d' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+[mhdw]$/)
  @Expose()
  interval?: string;

  @ApiPropertyOptional({ description: 'Number of points', example: 90 })
  @Transform(optionalNumberTransformer)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Expose()
  count?: number;
}
