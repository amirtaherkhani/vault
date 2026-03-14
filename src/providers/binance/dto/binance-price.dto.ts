import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

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

@Exclude()
export class BinancePriceDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: '65000.12', nullable: true })
  @Expose()
  price!: string | null;

  @ApiProperty({ enum: ['rest', 'cache'] })
  @IsEnum(['rest', 'cache'])
  @Expose()
  source!: 'rest' | 'cache';
}
