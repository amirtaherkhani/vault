import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { BinanceChartPreset } from '../types/binance-const.type';
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
  @IsString()
  preset?: BinanceChartPreset;
}

export class BinanceChartHeaderDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: '65000.12', nullable: true })
  price!: string | null;

  @ApiProperty({ example: 4.5, nullable: true })
  changePercent!: number | null;

  @ApiProperty({ example: 'today' })
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  interval!: string;
}

export class BinanceChartSeriesQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'today', required: false, default: 'today' })
  @IsOptional()
  @IsString()
  preset?: BinanceChartPreset;

  @ApiProperty({ example: 300, required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class BinanceChartSeriesDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: 'today' })
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  interval!: string;

  @ApiProperty({
    example: { open: 65000, time: 1710000000000 },
    nullable: true,
  })
  baseline!: { open: number | null; time: number | null };

  @ApiProperty({ example: '65050.21', nullable: true })
  price!: string | null;

  @ApiProperty({ example: 1.5, nullable: true })
  changePercent!: number | null;

  @ApiProperty({ type: [BinanceCandleDto] })
  points!: BinanceCandleDto[];
}

export class BinanceChartMidPriceQueryDto {
  @ApiProperty({ example: 'BTCUSDT,ETHUSDT' })
  @IsString()
  symbols!: string;
}

export class BinanceChartMidPriceDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: '65020.21', nullable: true })
  price!: string | null;

  @ApiProperty({ enum: ['rest:mid', 'rest:last'] })
  source!: 'rest:mid' | 'rest:last';
}

export class BinanceChartSeriesRangeQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'today', required: false, default: 'today' })
  @IsOptional()
  @IsString()
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

export class BinanceChartSeriesRangeDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: 'today' })
  preset!: BinanceChartPreset;

  @ApiProperty({ example: '5m' })
  interval!: string;

  @ApiProperty({ type: [BinanceCandleDto] })
  points!: BinanceCandleDto[];

  @ApiProperty({
    example: { startTime: 1710000000000, endTime: 1710003600000 },
    nullable: true,
  })
  range!: { startTime?: number; endTime?: number };
}
