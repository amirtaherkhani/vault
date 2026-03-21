// -----------------------------------------------------------------------------
// CMC - Cryptocurrency DTOs (v1)
// Covers responses for:
//  - map
//  - info
//  - listings/latest
//  - quotes/latest
//  - quotes/historical
//  - ohlcv/latest
//  - ohlcv/historical
//  - market-pairs/latest
//  - trending/latest
//  - trending/most-visited
//  - trending/gainers-losers
// -----------------------------------------------------------------------------

import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';

import { CmcEnvelopeDto, CmcStatusDto } from './cmc-base.response.dto';

// -----------------------------------------------------------------------------
// Reusable building blocks
// -----------------------------------------------------------------------------

@Exclude()
export class CmcPlatformRefDto {
  @ApiPropertyOptional({ description: 'Parent platform CMC Id', example: 1027 })
  @IsOptional()
  @IsInt()
  @Expose()
  id?: number;

  @ApiPropertyOptional({ example: 'Ethereum' })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: 'ETH' })
  @IsOptional()
  @IsString()
  @Expose()
  symbol?: string;

  @ApiPropertyOptional({ example: 'ethereum' })
  @IsOptional()
  @IsString()
  @Expose()
  slug?: string;

  @ApiPropertyOptional({
    example: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    description: 'On-chain contract address (tokens)',
  })
  @IsOptional()
  @IsString()
  @Expose()
  token_address?: string;
}

@Exclude()
export class CmcQuoteCurrencyBaseDto {
  @ApiPropertyOptional({ example: '2018-08-09T21:56:28.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
export class CmcQuoteCurrencyLatestDto extends CmcQuoteCurrencyBaseDto {
  @ApiProperty({ example: 6602.60701122 })
  @IsNumber()
  @Expose()
  price!: number;

  @ApiProperty({ example: 4314444687.5194 })
  @IsNumber()
  @Expose()
  volume_24h!: number;

  @ApiPropertyOptional({ example: -0.152774 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_change_24h?: number;

  @ApiPropertyOptional({ example: 0.988615 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_1h?: number;

  @ApiPropertyOptional({ example: 4.37185 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_24h?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_7d?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_30d?: number;

  @ApiPropertyOptional({ example: 852164659250.2758 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap?: number;

  @ApiPropertyOptional({ example: 51 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap_dominance?: number;

  @ApiPropertyOptional({ example: 952835089431.14 })
  @IsOptional()
  @IsNumber()
  @Expose()
  fully_diluted_market_cap?: number;
}

@Exclude()
export class CmcAssetBaseDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 'bitcoin' })
  @IsString()
  @Expose()
  slug!: string;

  @ApiPropertyOptional({
    description: 'Boolean or numeric (0/1) depending on endpoint',
    oneOf: [{ type: 'boolean' }, { type: 'integer' }],
    examples: [true, 1],
  })
  @IsOptional()
  @Expose()
  is_active?: boolean | number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Expose()
  is_fiat?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Expose()
  cmc_rank?: number;

  @ApiPropertyOptional({ example: '2013-04-28T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  date_added?: string;

  @ApiPropertyOptional({ type: [String], example: ['mineable'] })
  @IsOptional()
  @IsArray()
  @Expose()
  tags?: any[];

  @ApiPropertyOptional({ type: () => CmcPlatformRefDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmcPlatformRefDto)
  @Expose()
  platform?: CmcPlatformRefDto | null;

  @ApiPropertyOptional({ example: 17199862 })
  @IsOptional()
  @IsNumber()
  @Expose()
  circulating_supply?: number;

  @ApiPropertyOptional({ example: 17199862 })
  @IsOptional()
  @IsNumber()
  @Expose()
  total_supply?: number;

  @ApiPropertyOptional({ example: 21000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  max_supply?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  infinite_supply?: boolean | null;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  self_reported_circulating_supply?: number | null;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  self_reported_market_cap?: number | null;
}

// -----------------------------------------------------------------------------
// OHLCV - shared points
// -----------------------------------------------------------------------------

@Exclude()
export class CmcOhlcvPointBaseDto {
  @ApiPropertyOptional({ example: 6301.57 })
  @IsOptional()
  @IsNumber()
  @Expose()
  open?: number;

  @ApiPropertyOptional({ example: 6374.98 })
  @IsOptional()
  @IsNumber()
  @Expose()
  high?: number;

  @ApiPropertyOptional({ example: 6292.76 })
  @IsOptional()
  @IsNumber()
  @Expose()
  low?: number;

  @ApiPropertyOptional({ example: 6308.76 })
  @IsOptional()
  @IsNumber()
  @Expose()
  close?: number;

  @ApiPropertyOptional({ example: 3786450000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume?: number;

  @ApiPropertyOptional({ example: '2018-09-10T18:54:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
export class CmcCryptoOhlcvHistoricalPointDto {
  @ApiProperty({ example: '2019-01-02T00:00:00.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  time_open!: string;

  @ApiProperty({ example: '2019-01-02T23:59:59.999Z' })
  @IsString()
  @IsDateString()
  @Expose()
  time_close!: string;

  @ApiPropertyOptional({ example: '2019-01-02T03:53:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  time_high?: string;

  @ApiPropertyOptional({ example: '2019-01-02T02:43:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  time_low?: string;

  @ApiProperty({
    description: 'Per-convert OHLCV (map keyed by convert symbol)',
    type: Object,
  })
  @IsObject()
  @Expose()
  quote!: Record<
    string,
    {
      open: number;
      high: number;
      low: number;
      close: number;
      volume?: number;
      market_cap?: number;
      timestamp: string;
    }
  >;
}

// -----------------------------------------------------------------------------
// Market pairs - shared items
// -----------------------------------------------------------------------------

@Exclude()
export class CmcCryptoMarketPairExchangeDto {
  @ApiProperty({ example: 157 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'BitMEX' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'bitmex' })
  @IsString()
  @Expose()
  slug!: string;
}

@Exclude()
export class CmcCryptoMarketPairLegDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  currency_id!: number;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  currency_symbol!: string;

  @ApiProperty({ example: 'XBT' })
  @IsString()
  @Expose()
  exchange_symbol!: string;

  @ApiProperty({ example: 'cryptocurrency' })
  @IsString()
  @Expose()
  currency_type!: string;
}

@Exclude()
export class CmcCryptoMarketPairQuoteDto {
  @ApiPropertyOptional({
    description: 'Exchange-reported values',
    example: {
      price: 7839,
      volume_24h_base: 434215.85,
      volume_24h_quote: 3403818072.33,
      last_updated: '2019-05-24T02:39:00.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  @Expose()
  exchange_reported?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Converted quote (e.g., USD)',
    example: {
      price: 7839,
      volume_24h: 3403818072.33,
      last_updated: '2019-05-24T02:39:00.000Z',
    },
  })
  @IsOptional()
  @IsObject()
  @Expose()
  USD?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Other convert symbols',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @Expose()
  other?: Record<string, any>;
}

@Exclude()
export class CmcCryptoMarketPairItemDto {
  @ApiProperty({ type: () => CmcCryptoMarketPairExchangeDto })
  @ValidateNested()
  @Type(() => CmcCryptoMarketPairExchangeDto)
  @Expose()
  exchange!: CmcCryptoMarketPairExchangeDto;

  @ApiProperty({ example: 4902 })
  @IsInt()
  @Expose()
  market_id!: number;

  @ApiProperty({ example: 'BTC/USD' })
  @IsString()
  @Expose()
  market_pair!: string;

  @ApiProperty({ example: 'spot' })
  @IsString()
  @Expose()
  category!: string;

  @ApiProperty({ example: 'percentage' })
  @IsString()
  @Expose()
  fee_type!: string;

  @ApiProperty({ type: () => CmcCryptoMarketPairLegDto })
  @ValidateNested()
  @Type(() => CmcCryptoMarketPairLegDto)
  @Expose()
  market_pair_base!: CmcCryptoMarketPairLegDto;

  @ApiProperty({ type: () => CmcCryptoMarketPairLegDto })
  @ValidateNested()
  @Type(() => CmcCryptoMarketPairLegDto)
  @Expose()
  market_pair_quote!: CmcCryptoMarketPairLegDto;

  @ApiProperty({ type: () => CmcCryptoMarketPairQuoteDto })
  @ValidateNested()
  @Type(() => CmcCryptoMarketPairQuoteDto)
  @Expose()
  quote!: CmcCryptoMarketPairQuoteDto;
}

// -----------------------------------------------------------------------------
// Trending
// -----------------------------------------------------------------------------

@Exclude()
export class CmcTrendingAssetDto extends CmcAssetBaseDto {
  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Expose()
  num_market_pairs?: number;

  @ApiPropertyOptional({
    description: 'Quote by convert symbol',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CmcQuoteCurrencyLatestDto)
  @Expose()
  quote?: Record<string, CmcQuoteCurrencyLatestDto>;

  @ApiPropertyOptional({ example: '2018-08-09T22:53:32.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
@ApiExtraModels(CmcTrendingAssetDto, CmcStatusDto)
export class CmcTrendingLatestV1Dto extends CmcEnvelopeDto<
  CmcTrendingAssetDto[]
> {
  @ApiProperty({ type: () => [CmcTrendingAssetDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CmcTrendingAssetDto)
  @Expose()
  data!: CmcTrendingAssetDto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

export class CmcTrendingMostVisitedV1Dto extends CmcTrendingLatestV1Dto {}
export class CmcTrendingGainersLosersV1Dto extends CmcTrendingLatestV1Dto {}

// -----------------------------------------------------------------------------
// v1 - map, info, listings, quotes, ohlcv, market pairs
// -----------------------------------------------------------------------------

// Map
@Exclude()
export class CmcCryptoMapItemV1Dto extends CmcAssetBaseDto {}

@Exclude()
@ApiExtraModels(CmcCryptoMapItemV1Dto, CmcStatusDto)
export class CmcCryptoMapV1Dto extends CmcEnvelopeDto<CmcCryptoMapItemV1Dto[]> {
  @ApiProperty({ type: () => [CmcCryptoMapItemV1Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoMapItemV1Dto)
  @Expose()
  data!: CmcCryptoMapItemV1Dto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Info
@Exclude()
export class CmcCryptoInfoItemV1Dto extends CmcAssetBaseDto {
  @ApiPropertyOptional({ example: 'https://bitcoin.org' })
  @IsOptional()
  @IsString()
  @Expose()
  website?: string;

  @ApiPropertyOptional({ example: 'Bitcoin is a decentralized...' })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://twitter.com/bitcoin'],
  })
  @IsOptional()
  @IsArray()
  @Expose()
  urls?: string[];

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  })
  @IsOptional()
  @IsString()
  @Expose()
  logo?: string;
}

@Exclude()
@ApiExtraModels(CmcCryptoInfoItemV1Dto, CmcStatusDto)
export class CmcCryptoInfoV1Dto extends CmcEnvelopeDto<
  Record<string, CmcCryptoInfoItemV1Dto>
> {
  @ApiProperty({
    description: 'Keyed by Id or symbol',
    type: Object,
  })
  @IsObject()
  @Expose()
  data!: Record<string, CmcCryptoInfoItemV1Dto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Info v2
@Exclude()
export class CmcCryptoInfoUrlsV2Dto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  website?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  technical_doc?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  twitter?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  reddit?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  message_board?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  announcement?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  chat?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  explorer?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  source_code?: string[];
}

@Exclude()
export class CmcCryptoInfoItemV2Dto extends CmcAssetBaseDto {
  @ApiPropertyOptional({ type: () => CmcCryptoInfoUrlsV2Dto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmcCryptoInfoUrlsV2Dto)
  @Expose()
  urls?: CmcCryptoInfoUrlsV2Dto;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  })
  @IsOptional()
  @IsString()
  @Expose()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Asset description',
    example: 'Bitcoin (BTC) is a consensus network ...',
  })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: '2013-04-28T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  @Expose()
  date_added?: string;

  @ApiPropertyOptional({ example: '2013-04-28T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  @Expose()
  date_launched?: string;

  @ApiPropertyOptional({ type: [String], example: ['mineable'] })
  @IsOptional()
  @IsArray()
  @Expose()
  tags?: any[];

  @ApiPropertyOptional({ example: 'coin' })
  @IsOptional()
  @IsString()
  @Expose()
  category?: string;

  @ApiPropertyOptional({ type: () => CmcPlatformRefDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmcPlatformRefDto)
  @Expose()
  platform?: CmcPlatformRefDto | null;

  @ApiPropertyOptional({ example: 19000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_circulating_supply?: number | null;

  @ApiPropertyOptional({ example: 500000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_market_cap?: number | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  self_reported_tags?: string[] | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Expose()
  infinite_supply?: boolean | null;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  notice?: string | null;
}

@Exclude()
@ApiExtraModels(CmcCryptoInfoItemV2Dto, CmcStatusDto)
export class CmcCryptoInfoV2Dto extends CmcEnvelopeDto<
  Record<string, CmcCryptoInfoItemV2Dto>
> {
  @ApiProperty({
    description: 'Keyed by Id or symbol',
    type: Object,
  })
  @IsObject()
  @Expose()
  data!: Record<string, CmcCryptoInfoItemV2Dto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Listings
@Exclude()
export class CmcCryptoListingItemV1Dto extends CmcAssetBaseDto {
  @ApiPropertyOptional({
    description: 'Quote map keyed by convert symbol',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CmcQuoteCurrencyLatestDto)
  @Expose()
  quote?: Record<string, CmcQuoteCurrencyLatestDto>;

  @ApiPropertyOptional({ example: '2018-08-09T21:56:28.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
@ApiExtraModels(CmcCryptoListingItemV1Dto, CmcStatusDto)
export class CmcCryptoListingsLatestV1Dto extends CmcEnvelopeDto<
  CmcCryptoListingItemV1Dto[]
> {
  @ApiProperty({ type: () => [CmcCryptoListingItemV1Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoListingItemV1Dto)
  @Expose()
  data!: CmcCryptoListingItemV1Dto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Listings v3
@Exclude()
export class CmcCryptoListingQuoteV3Dto {
  @ApiProperty({ example: 2781 })
  @IsNumber()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 6602.60701122 })
  @IsNumber()
  @Expose()
  price!: number;

  @ApiPropertyOptional({ example: 4314444687.5194 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h?: number;

  @ApiPropertyOptional({ example: 4314444687.5194 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h_reported?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_7d?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_7d_reported?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_30d?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_30d_reported?: number;

  @ApiPropertyOptional({ example: -0.152774 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_change_24h?: number;

  @ApiPropertyOptional({ example: 0.988615 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_1h?: number;

  @ApiPropertyOptional({ example: 4.37185 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_24h?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_7d?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_30d?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_60d?: number;

  @ApiPropertyOptional({ example: -12.1352 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_90d?: number;

  @ApiPropertyOptional({ example: 852164659250.2758 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap?: number;

  @ApiPropertyOptional({ example: 51 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap_dominance?: number;

  @ApiPropertyOptional({ example: 952835089431.14 })
  @IsOptional()
  @IsNumber()
  @Expose()
  fully_diluted_market_cap?: number;

  @ApiPropertyOptional({ example: 1000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  tvl?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap_by_total_supply?: number;

  @ApiPropertyOptional({ example: '2018-08-09T21:56:28.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
export class CmcCryptoListingItemV3Dto extends CmcAssetBaseDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Expose()
  infinite_supply?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Expose()
  is_market_cap_included_in_calc?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Expose()
  is_fiat?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  num_market_pairs?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  tvl_ratio?: number;

  @ApiPropertyOptional({ example: 19000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_circulating_supply?: number;

  @ApiPropertyOptional({ example: 500000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_market_cap?: number;

  @ApiPropertyOptional({ example: 18000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  unlocked_circulating_supply?: number;

  @ApiPropertyOptional({ example: 600000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  unlocked_market_cap?: number;

  @ApiPropertyOptional({
    description: 'Quote list (typically one per convert symbol)',
    type: [CmcCryptoListingQuoteV3Dto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoListingQuoteV3Dto)
  @Expose()
  quote?: CmcCryptoListingQuoteV3Dto[];
}

@Exclude()
@ApiExtraModels(CmcCryptoListingItemV3Dto, CmcStatusDto)
export class CmcCryptoListingsLatestV3Dto extends CmcEnvelopeDto<
  CmcCryptoListingItemV3Dto[]
> {
  @ApiProperty({ type: () => [CmcCryptoListingItemV3Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoListingItemV3Dto)
  @Expose()
  data!: CmcCryptoListingItemV3Dto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Quotes latest v3
@Exclude()
export class CmcCryptoTagV3Dto {
  @ApiPropertyOptional({ example: 'layer-1' })
  @IsOptional()
  @IsString()
  @Expose()
  slug?: string;

  @ApiPropertyOptional({ example: 'Layer 1' })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: 'category' })
  @IsOptional()
  @IsString()
  @Expose()
  category?: string;
}

@Exclude()
export class CmcCryptoQuoteItemV3Dto extends CmcAssetBaseDto {
  @ApiPropertyOptional({ type: [CmcCryptoTagV3Dto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoTagV3Dto)
  @Expose()
  tags?: CmcCryptoTagV3Dto[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Expose()
  infinite_supply?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Expose()
  is_market_cap_included_in_calc?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Expose()
  is_fiat?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  num_market_pairs?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  tvl_ratio?: number;

  @ApiPropertyOptional({ example: 19000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_circulating_supply?: number;

  @ApiPropertyOptional({ example: 500000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  self_reported_market_cap?: number;

  @ApiPropertyOptional({ example: 18000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  unlocked_circulating_supply?: number;

  @ApiPropertyOptional({ example: 600000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  unlocked_market_cap?: number;

  @ApiPropertyOptional({
    description: 'Quote list (typically one per convert symbol)',
    type: [CmcCryptoListingQuoteV3Dto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoListingQuoteV3Dto)
  @Expose()
  quote?: CmcCryptoListingQuoteV3Dto[];
}

@Exclude()
@ApiExtraModels(CmcCryptoQuoteItemV3Dto, CmcStatusDto)
export class CmcCryptoQuotesLatestV3Dto extends CmcEnvelopeDto<
  CmcCryptoQuoteItemV3Dto[]
> {
  @ApiProperty({ type: () => [CmcCryptoQuoteItemV3Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoQuoteItemV3Dto)
  @Expose()
  data!: CmcCryptoQuoteItemV3Dto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Quotes latest (v1)
@Exclude()
export class CmcCryptoQuotesLatestAssetV1Dto extends CmcAssetBaseDto {
  @ApiProperty({
    description: 'Per-convert quotes (map)',
    type: Object,
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CmcQuoteCurrencyLatestDto)
  @Expose()
  quote!: Record<string, CmcQuoteCurrencyLatestDto>;

  @ApiProperty({ example: '2018-08-09T21:56:28.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  last_updated!: string;
}

@Exclude()
@ApiExtraModels(CmcCryptoQuotesLatestAssetV1Dto, CmcStatusDto)
export class CmcCryptoQuotesLatestV1Dto extends CmcEnvelopeDto<
  Record<string, CmcCryptoQuotesLatestAssetV1Dto>
> {
  @ApiProperty({
    description: 'Keyed by Id or symbol',
    type: Object,
  })
  @IsObject()
  @Expose()
  data!: Record<string, CmcCryptoQuotesLatestAssetV1Dto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Quotes historical (v1)
@Exclude()
export class CmcCryptoQuotesHistoricalPointV1Dto {
  @ApiProperty({ example: '2018-06-22T19:29:37.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  timestamp!: string;

  @ApiProperty({
    description: 'Per-convert quotes (map)',
    type: Object,
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CmcQuoteCurrencyLatestDto)
  @Expose()
  quote!: Record<string, CmcQuoteCurrencyLatestDto>;
}

@Exclude()
export class CmcCryptoQuotesHistoricalAssetV1Dto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  is_active!: number;

  @ApiProperty({ type: () => [CmcCryptoQuotesHistoricalPointV1Dto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoQuotesHistoricalPointV1Dto)
  @Expose()
  quotes!: CmcCryptoQuotesHistoricalPointV1Dto[];
}

@Exclude()
@ApiExtraModels(
  CmcCryptoQuotesHistoricalPointV1Dto,
  CmcCryptoQuotesHistoricalAssetV1Dto,
  CmcStatusDto,
)
export class CmcCryptoQuotesHistoricalV1Dto extends CmcEnvelopeDto<CmcCryptoQuotesHistoricalAssetV1Dto> {
  @ApiProperty({ type: () => CmcCryptoQuotesHistoricalAssetV1Dto })
  @ValidateNested()
  @Type(() => CmcCryptoQuotesHistoricalAssetV1Dto)
  @Expose()
  data!: CmcCryptoQuotesHistoricalAssetV1Dto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Market pairs latest (v1)
@Exclude()
export class CmcMarketPairsDataV1Dto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 7526 })
  @IsInt()
  @Expose()
  num_market_pairs!: number;

  @ApiProperty({ type: () => [CmcCryptoMarketPairItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoMarketPairItemDto)
  @Expose()
  market_pairs!: CmcCryptoMarketPairItemDto[];
}

@Exclude()
@ApiExtraModels(CmcMarketPairsDataV1Dto, CmcStatusDto)
export class CmcCryptoMarketPairsLatestV1Dto extends CmcEnvelopeDto<CmcMarketPairsDataV1Dto> {
  @ApiProperty({ type: () => CmcMarketPairsDataV1Dto })
  @ValidateNested()
  @Type(() => CmcMarketPairsDataV1Dto)
  @Expose()
  data!: CmcMarketPairsDataV1Dto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Market pairs latest (v2) — same payload shape, different endpoint/version
@Exclude()
@ApiExtraModels(CmcMarketPairsDataV1Dto, CmcStatusDto)
export class CmcCryptoMarketPairsLatestV2Dto extends CmcEnvelopeDto<CmcMarketPairsDataV1Dto> {
  @ApiProperty({ type: () => CmcMarketPairsDataV1Dto })
  @ValidateNested()
  @Type(() => CmcMarketPairsDataV1Dto)
  @Expose()
  data!: CmcMarketPairsDataV1Dto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// OHLCV latest (v1)
@Exclude()
export class CmcOhlcvLatestAssetV1Dto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ example: '2018-09-10T00:00:00.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  time_open!: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  time_close?: string | null;

  @ApiProperty({ example: '2018-09-10T00:00:00.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  time_high!: string;

  @ApiProperty({ example: '2018-09-10T00:00:00.000Z' })
  @IsString()
  @IsDateString()
  @Expose()
  time_low!: string;

  @ApiProperty({
    description: 'Per-convert OHLCV point',
    type: Object,
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => CmcOhlcvPointBaseDto)
  @Expose()
  quote!: Record<string, CmcOhlcvPointBaseDto>;
}

@Exclude()
@ApiExtraModels(CmcOhlcvLatestAssetV1Dto, CmcStatusDto)
export class CmcCryptoOhlcvLatestV1Dto extends CmcEnvelopeDto<
  Record<string, CmcOhlcvLatestAssetV1Dto>
> {
  @ApiProperty({
    description: 'Keyed by id as string',
    type: Object,
  })
  @IsObject()
  @Expose()
  data!: Record<string, CmcOhlcvLatestAssetV1Dto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// OHLCV latest (v2) - same shape, different endpoint/version
@Exclude()
@ApiExtraModels(CmcOhlcvLatestAssetV1Dto, CmcStatusDto)
export class CmcCryptoOhlcvLatestV2Dto extends CmcEnvelopeDto<
  Record<string, CmcOhlcvLatestAssetV1Dto>
> {
  @ApiProperty({
    description: 'Keyed by id as string',
    type: Object,
  })
  @IsObject()
  @Expose()
  data!: Record<string, CmcOhlcvLatestAssetV1Dto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// OHLCV historical (v1)
@Exclude()
export class CmcOhlcvHistoricalAssetV1Dto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Bitcoin' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  @Expose()
  symbol!: string;

  @ApiProperty({ type: () => [CmcCryptoOhlcvHistoricalPointDto] })
  @ValidateNested({ each: true })
  @Type(() => CmcCryptoOhlcvHistoricalPointDto)
  @Expose()
  quotes!: CmcCryptoOhlcvHistoricalPointDto[];
}

@Exclude()
@ApiExtraModels(CmcOhlcvHistoricalAssetV1Dto, CmcStatusDto)
export class CmcCryptoOhlcvHistoricalV1Dto extends CmcEnvelopeDto<CmcOhlcvHistoricalAssetV1Dto> {
  @ApiProperty({ type: () => CmcOhlcvHistoricalAssetV1Dto })
  @ValidateNested()
  @Type(() => CmcOhlcvHistoricalAssetV1Dto)
  @Expose()
  data!: CmcOhlcvHistoricalAssetV1Dto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// OHLCV historical (v2) - same payload shape, different endpoint/version
@Exclude()
@ApiExtraModels(CmcOhlcvHistoricalAssetV1Dto, CmcStatusDto)
export class CmcCryptoOhlcvHistoricalV2Dto extends CmcEnvelopeDto<CmcOhlcvHistoricalAssetV1Dto> {
  @ApiProperty({ type: () => CmcOhlcvHistoricalAssetV1Dto })
  @ValidateNested()
  @Type(() => CmcOhlcvHistoricalAssetV1Dto)
  @Expose()
  data!: CmcOhlcvHistoricalAssetV1Dto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}
