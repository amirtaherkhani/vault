import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BinanceSupportedAssetsQueryDto {
  @ApiProperty({ example: 'USDT', required: false, default: 'USDT' })
  @IsOptional()
  @IsString()
  quoteAsset?: string;
}

@Exclude()
export class BinanceSupportedAssetDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @Expose()
  symbol!: string;

  @ApiProperty({ example: 'BTC' })
  @Expose()
  baseAsset!: string;

  @ApiProperty({ example: 'USDT' })
  @Expose()
  quoteAsset!: string;
}
