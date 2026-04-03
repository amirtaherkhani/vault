import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ------------------ Requests ------------------

export class PricesQueryDto {
  @ApiProperty({
    description: 'Comma-separated symbols (exactly one required)',
    example: 'BTC',
  })
  @IsString()
  symbols!: string;
}

export class MetadataQueryDto {
  @ApiProperty({ description: 'Comma-separated symbols', example: 'BTC,ETH' })
  @IsString()
  symbols!: string;
}

export class HistoryQueryDto {
  @ApiProperty({ example: 'BTC' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '2019-01-01' })
  @IsString()
  from!: string;

  @ApiProperty({ example: '2019-01-31' })
  @IsString()
  to!: string;

  @ApiProperty({ enum: ['daily', 'hourly'], example: 'daily' })
  @IsIn(['daily', 'hourly'])
  time_period!: 'daily' | 'hourly';

  @ApiPropertyOptional({ example: 'daily', default: 'daily' })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  convert?: string;
}

export class HistoryBatchedQueryDto extends HistoryQueryDto {}

export class QuotesHistoricalV2QueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated symbols',
    example: 'BTC,ETH',
  })
  @IsOptional()
  @IsString()
  symbols?: string;

  @ApiPropertyOptional({
    description: 'Comma-separated IDs',
    example: '1,1027',
  })
  @IsOptional()
  @IsString()
  ids?: string;

  @ApiPropertyOptional({ example: '2021-01-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  time_start?: string;

  @ApiPropertyOptional({ example: '2021-02-01T00:00:00Z' })
  @IsOptional()
  @IsString()
  time_end?: string;

  @ApiPropertyOptional({ description: 'Number of data points', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @ApiPropertyOptional({
    description: 'Interval (e.g., 1h,4h,1d)',
    example: '1d',
  })
  @IsOptional()
  @IsString()
  interval?: string;

  @ApiPropertyOptional({
    description: 'Convert to symbols (CSV)',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  convert?: string;

  @ApiPropertyOptional({ description: 'Convert to ids (CSV)', example: '2781' })
  @IsOptional()
  @IsString()
  convert_id?: string;

  @ApiPropertyOptional({
    description: 'Aux fields CSV',
    example: 'market_cap,volume_24h',
  })
  @IsOptional()
  @IsString()
  aux?: string;

  @ApiPropertyOptional({ description: 'Skip invalid symbols', example: true })
  @IsOptional()
  skip_invalid?: boolean;

  @ApiPropertyOptional({ description: 'Preset name', example: '1m' })
  @IsOptional()
  @IsString()
  preset?: string;
}

export class QuotesHistoricalV2ResolvedParamsDto extends QuotesHistoricalV2QueryDto {}

// ------------------ Responses ------------------

@Exclude()
export class PriceEntryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Expose()
  id?: number;

  @ApiPropertyOptional({ example: 'BTC' })
  @IsOptional()
  @Expose()
  symbol?: string;

  @ApiPropertyOptional({ example: 'Bitcoin' })
  @IsOptional()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Expose()
  rank?: number;

  @ApiProperty({ example: 6308.76 })
  @IsNumber()
  @Expose()
  price!: number;

  @ApiPropertyOptional({ example: 3786450000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  volume_24h?: number;

  @ApiPropertyOptional({ example: 852164659250.2758 })
  @IsOptional()
  @IsNumber()
  @Expose()
  market_cap?: number;

  @ApiPropertyOptional({ example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Expose()
  marketCapChange24h?: number;

  @ApiPropertyOptional({ example: -0.15 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_1h?: number;

  @ApiPropertyOptional({ example: 4.37 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_24h?: number;

  @ApiPropertyOptional({ example: -12.13 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_7d?: number;

  @ApiPropertyOptional({ example: -8.5 })
  @IsOptional()
  @IsNumber()
  @Expose()
  percent_change_30d?: number;

  @ApiPropertyOptional({ example: 19000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  circulatingSupply?: number | null;

  @ApiPropertyOptional({ example: 21000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  totalSupply?: number | null;

  @ApiPropertyOptional({ example: 21000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  maxSupply?: number | null;

  @ApiPropertyOptional({ example: 900000000000 })
  @IsOptional()
  @IsNumber()
  @Expose()
  fullyDilutedMarketCap?: number;

  @ApiPropertyOptional({ example: '2018-08-09T21:56:28.000Z' })
  @IsOptional()
  @IsString()
  @IsDateString()
  @Expose()
  last_updated?: string;
}

@Exclude()
export class PricesResponseDto extends PriceEntryDto {}

@Exclude()
export class MetadataItemDto {
  @ApiPropertyOptional({ example: 'Bitcoin' })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: 'BTC' })
  @IsOptional()
  @IsString()
  @Expose()
  symbol?: string;

  @ApiPropertyOptional({
    example: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png',
  })
  @IsOptional()
  @IsString()
  @Expose()
  logo?: string;

  @ApiPropertyOptional({ example: 'Bitcoin is ...' })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: '2013-04-28T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  @Expose()
  date_added?: string;
}

@Exclude()
export class MetadataResponseDto {
  @ApiProperty({ type: Object })
  @Expose()
  data!: Record<string, MetadataItemDto>;
}

@Exclude()
export class GlobalStatsDto {
  @ApiProperty({ example: 2941 })
  @IsNumber()
  @Expose()
  activeCryptocurrencies!: number;

  @ApiProperty({ example: 2374432083905.6846 })
  @IsNumber()
  @Expose()
  totalMarketCap!: number;

  @ApiProperty({ example: 262906061281.24 })
  @IsNumber()
  @Expose()
  totalVolume24h!: number;

  @ApiProperty({ example: 67.0057 })
  @IsNumber()
  @Expose()
  bitcoinDominance!: number;

  @ApiProperty({ example: 9.02205 })
  @IsNumber()
  @Expose()
  ethDominance!: number;

  @ApiPropertyOptional({ example: 12.5 })
  @IsOptional()
  @IsNumber()
  @Expose()
  defiDominance?: number;
}

// History responses are provider-shaped; keep them generic
export type HistoryResponseDto = any;
export type HistoryBatchedResponseDto = any[];
export type QuotesHistoricalV2ResponseDto = any;
