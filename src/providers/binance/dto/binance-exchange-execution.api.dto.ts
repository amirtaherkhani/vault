import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { BinanceSymbolStatus } from '../types/binance-symbol-status.type';

export class BinanceExchangeInfoApiQueryDto {
  @ApiPropertyOptional({ example: 'BTC_USDT' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({
    example: ['BTC_USDT', 'ETH_USDT'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({
    example: ['SPOT', 'MARGIN'],
    default: ['SPOT'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showPermissionSets?: boolean;

  @ApiPropertyOptional({
    enum: BinanceSymbolStatus,
    description:
      'Optional tradingStatus filter. Not allowed together with symbol/symbols.',
  })
  @IsOptional()
  @IsEnum(BinanceSymbolStatus)
  symbolStatus?: BinanceSymbolStatus;
}

export class BinanceExecutionRulesApiQueryDto {
  @ApiPropertyOptional({ example: 'BTC_USDT' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.symbols?.length && !o.symbolStatus)
  symbol?: string;

  @ApiPropertyOptional({
    example: ['BTC_USDT', 'ETH_USDT'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => !o.symbol && !o.symbolStatus)
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({
    enum: BinanceSymbolStatus,
    description: 'Query symbols with the specified trading status',
  })
  @IsOptional()
  @ValidateIf((o) => !o.symbol && !o.symbols?.length)
  @IsEnum(BinanceSymbolStatus)
  symbolStatus?: BinanceSymbolStatus;
}
