import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class BinanceSupportedAssetsQueryDto {
  @ApiPropertyOptional({ example: 'USDT', default: 'USDT', type: String })
  @IsOptional()
  @IsString()
  quoteAsset?: string;
}

@Exclude()
export class BinanceSupportedAssetDto {
  @ApiProperty({ example: 'BTC_USDT' })
  @Expose()
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'BTC' })
  @Expose()
  @IsString()
  baseAsset!: string;

  @ApiProperty({ example: 'USDT' })
  @Expose()
  @IsString()
  quoteAsset!: string;
}
