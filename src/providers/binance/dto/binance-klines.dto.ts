import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { BinanceKlineInterval } from '../types/binance-const.type';
import { BinanceKlineIntervalEnum } from '../types/binance-enum.type';

export class BinanceHistoryQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '1m', required: false, default: '1m' })
  @IsOptional()
  @IsEnum(BinanceKlineIntervalEnum)
  interval?: BinanceKlineInterval;

  @ApiProperty({ example: 100, required: false, default: 100 })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({
    description: 'Use live stream cache when available',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsString()
  live?: string;
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
