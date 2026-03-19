import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class BinanceHealthItemDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  ok!: boolean;

  @ApiProperty({ example: 'ok', required: false })
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;
}

@Exclude()
export class BinanceHealthDto {
  @ApiProperty({ example: true })
  @Expose()
  ok!: boolean;

  @ApiProperty({ type: BinanceHealthItemDto })
  @ValidateNested()
  @Type(() => BinanceHealthItemDto)
  @Expose()
  rest!: BinanceHealthItemDto;

  @ApiProperty({ type: BinanceHealthItemDto })
  @ValidateNested()
  @Type(() => BinanceHealthItemDto)
  @Expose()
  socket!: BinanceHealthItemDto;
}
