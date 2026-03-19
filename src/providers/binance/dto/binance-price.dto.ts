import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class BinancePriceQueryDto {
  @ApiProperty({
    description: 'Comma-separated symbols in BASE_QUOTE format (e.g. BTC_USDT)',
    example: 'BTC_USDT,ETH_USDT',
    type: String,
  })
  @IsString()
  symbols!: string;

  @ApiPropertyOptional({
    description: 'Use live price stream when available',
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
