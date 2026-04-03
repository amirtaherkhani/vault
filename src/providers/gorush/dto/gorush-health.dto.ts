import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

@Exclude()
export class GorushHealthDto {
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
    description: 'Realtime/socket connectivity status (gorush: none)',
  })
  @IsBoolean()
  @Expose()
  realtime!: boolean;

  @ApiProperty({ example: 200, description: 'Health endpoint HTTP status' })
  @IsNumber()
  @Expose()
  httpStatus!: number;

  @ApiProperty({ example: 'ok', required: false })
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;

  @ApiProperty({
    example: { restApi: { httpStatus: 200, message: 'ok' } },
    description: 'Detailed checks',
  })
  @Expose()
  details!: { restApi: { httpStatus: number; message?: string } };
}
