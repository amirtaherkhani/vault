import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@Exclude()
export class BinanceHealthDto {
  @ApiProperty({
    example: true,
    description: 'Indicates if Binance REST is reachable',
  })
  @IsBoolean()
  @Expose()
  ok!: boolean;

  @ApiProperty({
    example: 'ok',
    description: 'Optional message for additional context',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;
}
