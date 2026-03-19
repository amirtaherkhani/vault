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

  @ApiPropertyOptional({ example: 1565246363776, type: Number })
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

export class BinanceExecutionRuleDto {
  @ApiProperty({ example: 'PRICE_RANGE' })
  @IsString()
  ruleType!: string;

  @ApiProperty({ example: '1.0001', required: false })
  @IsOptional()
  @IsString()
  bidLimitMultUp?: string;

  @ApiProperty({ example: '0.9999', required: false })
  @IsOptional()
  @IsString()
  bidLimitMultDown?: string;

  @ApiProperty({ example: '1.0001', required: false })
  @IsOptional()
  @IsString()
  askLimitMultUp?: string;

  @ApiProperty({ example: '0.9999', required: false })
  @IsOptional()
  @IsString()
  askLimitMultDown?: string;
}

export class BinanceExecutionSymbolRulesDto {
  @ApiProperty({ example: 'BAZUSD' })
  @IsString()
  symbol!: string;

  @ApiProperty({ type: [BinanceExecutionRuleDto] })
  @IsArray()
  rules!: BinanceExecutionRuleDto[];
}

export class BinanceExecutionRulesResponseDto {
  @ApiProperty({ type: [BinanceExecutionSymbolRulesDto] })
  @IsArray()
  symbolRules!: BinanceExecutionSymbolRulesDto[];
}
