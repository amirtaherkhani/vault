import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BinanceHistoryQueryDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '1m', required: false, default: '1m' })
  @IsOptional()
  @IsString()
  interval?: string;

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

export class BinanceCandleDto {
  @ApiProperty({ example: 1710000000000 })
  openTime!: number;

  @ApiProperty({ example: '65000.12' })
  open!: string;

  @ApiProperty({ example: '65500.99' })
  high!: string;

  @ApiProperty({ example: '64900.01' })
  low!: string;

  @ApiProperty({ example: '65200.45' })
  close!: string;

  @ApiProperty({ example: '1234.56' })
  volume!: string;

  @ApiProperty({ example: 1710000300000 })
  closeTime!: number;

  @ApiProperty({ enum: ['rest', 'cache', 'ws'], required: false })
  source?: 'rest' | 'cache' | 'ws';

  @ApiProperty({ required: false })
  closed?: boolean;

  @ApiProperty({ required: false, nullable: true })
  changePercent?: number | null;

  @ApiProperty({ required: false, nullable: true })
  prevChangePercent?: number | null;
}
