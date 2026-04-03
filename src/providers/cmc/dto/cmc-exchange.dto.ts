import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CmcEnvelopeDto, CmcStatusDto } from './cmc-base.response.dto';
import {
  CmcCryptoMarketPairLegDto,
  CmcCryptoMarketPairQuoteDto,
} from './cmc-cryptocurrency.dto';

// Exchange map
@Exclude()
export class CmcExchangeMapItemDto {
  @ApiProperty({ example: 270 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Binance' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'binance' })
  @IsString()
  @Expose()
  slug!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Expose()
  is_active?: number;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string;

  @ApiPropertyOptional({ example: '2018-04-26T00:45:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  first_historical_data?: string;

  @ApiPropertyOptional({ example: '2019-06-02T21:25:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_historical_data?: string;
}

@Exclude()
@ApiExtraModels(CmcExchangeMapItemDto, CmcStatusDto)
export class CmcExchangeMapDto extends CmcEnvelopeDto<CmcExchangeMapItemDto[]> {
  @ApiProperty({ type: () => [CmcExchangeMapItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CmcExchangeMapItemDto)
  @Expose()
  data!: CmcExchangeMapItemDto[];

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Exchange info
@Exclude()
export class CmcExchangeUrlsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  website?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  twitter?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  blog?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  chat?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  fee?: string[];
}

@Exclude()
export class CmcExchangeInfoItemDto {
  @ApiProperty({ example: 270 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Binance' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'binance' })
  @IsString()
  @Expose()
  slug!: string;

  @ApiPropertyOptional({ example: 'https://.../270.png' })
  @IsOptional()
  @IsString()
  @Expose()
  logo?: string;

  @ApiPropertyOptional({ example: 'Launched in Jul-2017...' })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: '2017-07-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  @Expose()
  date_launched?: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  notice?: string | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  countries?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  fiats?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @Expose()
  tags?: string[] | null;

  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  @IsString()
  @Expose()
  type?: string;

  @ApiPropertyOptional({ example: 0.02 })
  @IsOptional()
  @IsNumber()
  @Expose()
  maker_fee?: number;

  @ApiPropertyOptional({ example: 0.04 })
  @IsOptional()
  @IsNumber()
  @Expose()
  taker_fee?: number;

  @ApiPropertyOptional({ example: 5123451 })
  @IsOptional()
  @IsNumber()
  @Expose()
  weekly_visits?: number;

  @ApiPropertyOptional({ example: 66926283498.60113 })
  @IsOptional()
  @IsNumber()
  @Expose()
  spot_volume_usd?: number;

  @ApiPropertyOptional({ example: '2021-05-06T01:20:15.451Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  spot_volume_last_updated?: string;

  @ApiPropertyOptional({ type: () => CmcExchangeUrlsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmcExchangeUrlsDto)
  @Expose()
  urls?: CmcExchangeUrlsDto;
}

@Exclude()
@ApiExtraModels(CmcExchangeInfoItemDto, CmcStatusDto)
export class CmcExchangeInfoDto extends CmcEnvelopeDto<
  Record<string, CmcExchangeInfoItemDto>
> {
  @ApiProperty({ description: 'Keyed by exchange id as string', type: Object })
  @IsObject()
  @Expose()
  data!: Record<string, CmcExchangeInfoItemDto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Exchange quotes latest
@Exclude()
export class CmcExchangeQuoteLatestDto {
  @ApiPropertyOptional({ example: 768478308.529847 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h?: number;

  @ApiPropertyOptional({ example: 768478308.529847 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h_adjusted?: number;

  @ApiPropertyOptional({ example: 3666423776 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_7d?: number;

  @ApiPropertyOptional({ example: 21338299776 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_30d?: number;

  @ApiPropertyOptional({ example: -11.8232 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_volume_24h?: number;

  @ApiPropertyOptional({ example: 67.0306 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_volume_7d?: number;

  @ApiPropertyOptional({ example: -0.0821558 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_volume_30d?: number;

  @ApiPropertyOptional({ example: 629.9774 })
  @IsOptional()
  @IsNumber()
  @Expose()
  effective_liquidity_24h?: number;
}

@Exclude()
export class CmcExchangeQuoteLatestWrapDto {
  @ApiProperty({ type: () => CmcExchangeQuoteLatestDto })
  @ValidateNested()
  @Type(() => CmcExchangeQuoteLatestDto)
  @Expose()
  USD!: CmcExchangeQuoteLatestDto;
}

@Exclude()
export class CmcExchangeQuotesLatestItemDto {
  @ApiProperty({ example: 270 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Binance' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'binance' })
  @IsString()
  @Expose()
  slug!: string;

  @ApiPropertyOptional({ example: 132 })
  @IsOptional()
  @IsInt()
  @Expose()
  num_coins?: number;

  @ApiPropertyOptional({ example: 385 })
  @IsOptional()
  @IsInt()
  @Expose()
  num_market_pairs?: number;

  @ApiPropertyOptional({ example: '2018-11-08T22:11:00.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  traffic_score?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Expose()
  rank?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  exchange_score?: number | null;

  @ApiPropertyOptional({ example: 9.8028 })
  @IsOptional()
  @IsNumber()
  @Expose()
  liquidity_score?: number;

  @ApiPropertyOptional({ type: () => CmcExchangeQuoteLatestWrapDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CmcExchangeQuoteLatestWrapDto)
  @Expose()
  quote?: CmcExchangeQuoteLatestWrapDto;
}

@Exclude()
@ApiExtraModels(CmcExchangeQuotesLatestItemDto, CmcStatusDto)
export class CmcExchangeQuotesLatestDto extends CmcEnvelopeDto<
  Record<string, CmcExchangeQuotesLatestItemDto>
> {
  @ApiProperty({ description: 'Keyed by exchange id as string', type: Object })
  @IsObject()
  @Expose()
  data!: Record<string, CmcExchangeQuotesLatestItemDto>;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}

// Exchange market pairs latest
@Exclude()
export class CmcExchangeMarketPairItemDto {
  @ApiProperty({ example: 9933 })
  @IsInt()
  @Expose()
  market_id!: number;

  @ApiProperty({ example: 'BTC/USDT' })
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

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Expose()
  outlier_detected?: number;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @Expose()
  exclusions?: any;

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

@Exclude()
export class CmcExchangeMarketPairsDataDto {
  @ApiProperty({ example: 270 })
  @IsInt()
  @Expose()
  id!: number;

  @ApiProperty({ example: 'Binance' })
  @IsString()
  @Expose()
  name!: string;

  @ApiProperty({ example: 'binance' })
  @IsString()
  @Expose()
  slug!: string;

  @ApiProperty({ example: 473 })
  @IsInt()
  @Expose()
  num_market_pairs!: number;

  @ApiPropertyOptional({ example: 769291636.239632 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h?: number;

  @ApiProperty({ type: () => [CmcExchangeMarketPairItemDto] })
  @ValidateNested({ each: true })
  @Type(() => CmcExchangeMarketPairItemDto)
  @Expose()
  market_pairs!: CmcExchangeMarketPairItemDto[];
}

@Exclude()
@ApiExtraModels(CmcExchangeMarketPairsDataDto, CmcStatusDto)
export class CmcExchangeMarketPairsLatestDto extends CmcEnvelopeDto<CmcExchangeMarketPairsDataDto> {
  @ApiProperty({ type: () => CmcExchangeMarketPairsDataDto })
  @ValidateNested()
  @Type(() => CmcExchangeMarketPairsDataDto)
  @Expose()
  data!: CmcExchangeMarketPairsDataDto;

  @ApiProperty({ type: () => CmcStatusDto })
  @ValidateNested()
  @Type(() => CmcStatusDto)
  @Expose()
  status!: CmcStatusDto;
}
