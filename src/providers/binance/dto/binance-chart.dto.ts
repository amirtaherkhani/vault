import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { BinanceChartPreset } from '../types/binance-const.type';
import { BinanceChartPresetEnum } from '../types/binance-enum.type';
import { BinanceCandleDto } from './binance-klines.dto';

export class BinanceChartHeaderQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({
    example: 'today',
    required: false,
    default: 'today',
  })
  @IsOptional()
  @IsEnum(BinanceChartPresetEnum)
  preset?: BinanceChartPreset;
}

@Exclude()
export class BinanceChartHeaderDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: '65000.12', nullable: true })
  @Expose()
  price!: string | null;

  @ApiProperty({ example: 4.5, nullable: true })
  @Expose()
  changePercent!: number | null;

  @ApiProperty({ example: 'today' })
  @Expose()
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  @Expose()
  interval!: string;
}

export class BinanceChartSeriesQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'today', required: false, default: 'today' })
  @IsOptional()
  @IsEnum(BinanceChartPresetEnum)
  preset?: BinanceChartPreset;

  @ApiProperty({ example: 300, required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}

@Exclude()
export class BinanceChartSeriesDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 'today' })
  @Expose()
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  @Expose()
  interval!: string;

  @ApiProperty({
    example: { open: 65000, time: 1710000000000 },
    nullable: true,
  })
  @Expose()
  baseline!: { open: number | null; time: number | null };

  @ApiProperty({ example: '65050.21', nullable: true })
  @Expose()
  price!: string | null;

  @ApiProperty({ example: 1.5, nullable: true })
  @Expose()
  changePercent!: number | null;

  @ApiProperty({ type: [BinanceCandleDto] })
  @Type(() => BinanceCandleDto)
  @Expose()
  points!: BinanceCandleDto[];
}

export class BinanceChartMidPriceQueryDto {
  @ApiProperty({ example: 'BTCUSDT,ETHUSDT' })
  @IsString()
  symbols!: string;
}

@Exclude()
export class BinanceChartMidPriceDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: '65020.21', nullable: true })
  @Expose()
  price!: string | null;

  @ApiProperty({ enum: ['rest:mid', 'rest:last'] })
  @Expose()
  source!: 'rest:mid' | 'rest:last';
}

export class BinanceChartSeriesRangeQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'today', required: false, default: 'today' })
  @IsOptional()
  @IsEnum(BinanceChartPresetEnum)
  preset?: BinanceChartPreset;

  @ApiProperty({ example: 1710000000000, required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ example: 1710003600000, required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}

@Exclude()
export class BinanceChartSeriesRangeDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 'today' })
  @Expose()
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  @Expose()
  interval!: string;

  @ApiProperty({ type: [BinanceCandleDto] })
  @Type(() => BinanceCandleDto)
  @Expose()
  points!: BinanceCandleDto[];

  @ApiProperty({
    example: { startTime: 1710000000000, endTime: 1710003600000 },
    nullable: true,
  })
  @Expose()
  range!: { startTime?: number; endTime?: number };
}
