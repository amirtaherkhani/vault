import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class BinanceTickerPriceResponseDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '65000.12' })
  @IsString()
  price!: string;
}

export class BinanceBookTickerResponseDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '64999.99' })
  @IsString()
  bidPrice!: string;

  @ApiProperty({ example: '1.25' })
  @IsString()
  bidQty!: string;

  @ApiProperty({ example: '65001.02' })
  @IsString()
  askPrice!: string;

  @ApiProperty({ example: '0.8' })
  @IsString()
  askQty!: string;
}

export class BinanceExchangeInfoSymbolDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: 'TRADING' })
  @IsString()
  status!: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  baseAsset!: string;

  @ApiProperty({ example: 'USDT' })
  @IsString()
  quoteAsset!: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isSpotTradingAllowed?: boolean;
}

export class BinanceExchangeInfoResponseDto {
  @ApiPropertyOptional({ example: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 1565246363776 })
  @IsOptional()
  @IsNumber()
  serverTime?: number;

  @ApiProperty({ type: [BinanceExchangeInfoSymbolDto] })
  @IsArray()
  symbols!: BinanceExchangeInfoSymbolDto[];
}

export class BinancePingResponseDto {
  @ApiPropertyOptional({ example: {}, type: Object, nullable: true })
  @IsOptional()
  payload?: Record<string, unknown>;
}

export class BinanceTimeResponseDto {
  @ApiProperty({ example: 1499827319559 })
  @IsNumber()
  serverTime!: number;
}
