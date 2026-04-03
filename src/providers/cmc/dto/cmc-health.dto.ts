import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

@Exclude()
export class CmcHealthItemDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  status!: boolean;

  @ApiProperty({ example: 'ok', required: false })
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;
}

@Exclude()
export class CmcHealthDto {
  @ApiProperty({ example: true, description: 'Overall provider status' })
  @IsBoolean()
  @Expose()
  status!: boolean;

  @ApiProperty({ example: true, description: 'Provider enabled via config' })
  @IsBoolean()
  @Expose()
  enable!: boolean;

  @ApiProperty({
    example: false,
    description: 'Realtime/socket connectivity (if applicable)',
  })
  @IsBoolean()
  @Expose()
  realtime!: boolean;

  @ApiProperty({
    description: 'Detailed checks',
    example: { restApi: { status: true, message: 'ok' } },
  })
  @Expose()
  details!: { restApi: CmcHealthItemDto };
}
