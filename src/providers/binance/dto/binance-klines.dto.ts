import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import type { BinanceKlineInterval } from '../types/binance-const.type';
import { BinanceKlineIntervalEnum } from '../types/binance-enum.type';

export type BinanceKlineRaw = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export class BinanceHistoryQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiPropertyOptional({
    example: '1m',
    default: '1m',
    enum: BinanceKlineIntervalEnum,
  })
  @IsOptional()
  @IsEnum(BinanceKlineIntervalEnum)
  interval?: BinanceKlineInterval;

  @ApiPropertyOptional({ example: 100, default: 100, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Use live stream cache when available',
    default: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true' || value === '1';
  })
  live?: boolean;
}

@Exclude()
export class BinanceCandleDto {
  @ApiProperty({ example: 1710000000000 })
  @Expose()
  openTime!: number;

  @ApiProperty({ example: '65000.12' })
  @Expose()
  open!: string;

  @ApiProperty({ example: '65500.99' })
  @Expose()
  high!: string;

  @ApiProperty({ example: '64900.01' })
  @Expose()
  low!: string;

  @ApiProperty({ example: '65200.45' })
  @Expose()
  close!: string;

  @ApiProperty({ example: '1234.56' })
  @Expose()
  volume!: string;

  @ApiProperty({ example: 1710000300000 })
  @Expose()
  closeTime!: number;

  @ApiProperty({ enum: ['rest', 'cache', 'ws'], required: false })
  @IsOptional()
  @Expose()
  source?: 'rest' | 'cache' | 'ws';

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  closed?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Expose()
  changePercent?: number | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @Expose()
  prevChangePercent?: number | null;
}
