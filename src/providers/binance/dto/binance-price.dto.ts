import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BinancePriceQueryDto {
  @ApiProperty({
    description: 'Comma-separated symbols in BASE_QUOTE format (e.g. BTC_USDT)',
    example: 'BTC_USDT,ETH_USDT',
  })
  @IsString()
  symbols!: string;

  @ApiProperty({
    description: 'Use live price stream when available',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsString()
  live?: string;
}

export class BinancePriceDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: '65000.12', nullable: true })
  price!: string | null;

  @ApiProperty({ enum: ['rest', 'cache'] })
  source!: 'rest' | 'cache';
}
