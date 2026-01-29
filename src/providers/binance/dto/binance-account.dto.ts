import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BinanceSupportedAssetsQueryDto {
  @ApiProperty({ example: 'USDT', required: false, default: 'USDT' })
  @IsOptional()
  @IsString()
  quoteAsset?: string;
}

export class BinanceSupportedAssetDto {
  @ApiProperty({ example: 'BTCUSDT' })
  symbol!: string;

  @ApiProperty({ example: 'BTC' })
  baseAsset!: string;

  @ApiProperty({ example: 'USDT' })
  quoteAsset!: string;
}
