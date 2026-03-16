import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import type { BinanceChartPreset } from '../types/binance-const.type';
import { BinanceChartPresetEnum } from '../types/binance-enum.type';
import { BinanceCandleDto } from './binance-klines.dto';

export class BinanceChartHeaderQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiPropertyOptional({
    description:
      'Client timezone (IANA or offset, e.g. "America/New_York" or "+03:30")',
    example: 'Europe/Berlin',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({
    example: 'today',
    default: 'today',
    enum: BinanceChartPresetEnum,
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

  @ApiPropertyOptional({
    description:
      'Client timezone (IANA or offset, e.g. "America/New_York" or "+03:30")',
    example: 'Europe/Berlin',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({
    example: 'today',
    default: 'today',
    enum: BinanceChartPresetEnum,
  })
  @IsOptional()
  @IsEnum(BinanceChartPresetEnum)
  preset?: BinanceChartPreset;

  @ApiPropertyOptional({ example: 300, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
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

  @ApiPropertyOptional({
    description:
      'Client timezone (IANA or offset, e.g. "America/New_York" or "+03:30")',
    example: 'Europe/Berlin',
  })
  @IsOptional()
  @IsString()
  timeZone?: string;

  @ApiPropertyOptional({
    example: 'today',
    default: 'today',
    enum: BinanceChartPresetEnum,
  })
  @IsOptional()
  @IsEnum(BinanceChartPresetEnum)
  preset?: BinanceChartPreset;

  @ApiPropertyOptional({ example: 1710000000000, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ example: 1710003600000, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;

  @ApiPropertyOptional({ example: 1000, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
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
