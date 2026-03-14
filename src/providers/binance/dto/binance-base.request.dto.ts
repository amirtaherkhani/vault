import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum BinanceSymbolStatus {
  TRADING = 'TRADING',
  HALT = 'HALT',
  BREAK = 'BREAK',
}

export class BinanceTickerPriceRequestDto {
  @ApiPropertyOptional({ example: 'BTCUSDT' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.symbols?.length)
  symbol?: string;

  @ApiPropertyOptional({ example: ['BTCUSDT', 'ETHUSDT'] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => !o.symbol)
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({
    enum: BinanceSymbolStatus,
    description: 'Optional filter by trading status',
  })
  @IsOptional()
  @IsEnum(BinanceSymbolStatus)
  symbolStatus?: BinanceSymbolStatus;
}

export class BinanceBookTickerRequestDto {
  @ApiPropertyOptional({ example: 'BTCUSDT' })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => !o.symbols?.length)
  symbol?: string;

  @ApiPropertyOptional({ example: ['BTCUSDT', 'ETHUSDT'] })
  @IsOptional()
  @IsArray()
  @ValidateIf((o) => !o.symbol)
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({
    enum: BinanceSymbolStatus,
    description: 'Optional filter by trading status',
  })
  @IsOptional()
  @IsEnum(BinanceSymbolStatus)
  symbolStatus?: BinanceSymbolStatus;
}

export class BinanceKlinesRequestDto {
  @ApiProperty({ example: 'BTCUSDT' })
  @IsString()
  symbol!: string;

  @ApiProperty({ example: '1h' })
  @IsString()
  interval!: string;

  @ApiPropertyOptional({ example: 1700000000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  startTime?: number;

  @ApiPropertyOptional({ example: 1700003600000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  endTime?: number;

  @ApiPropertyOptional({ example: 500, default: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  timeZone?: string;
}

export class BinanceExchangeInfoRequestDto {
  @ApiPropertyOptional({ example: 'BTCUSDT' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ example: ['BTCUSDT', 'ETHUSDT'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symbols?: string[];

  @ApiPropertyOptional({ example: ['SPOT', 'MARGIN'] })
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
