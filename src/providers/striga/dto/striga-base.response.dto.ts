import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

@Exclude()
export class StrigaBaseResponseDto<T = unknown> {
  @ApiProperty({ example: 200 })
  @IsInt()
  @Expose()
  status!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  success!: boolean;

  @ApiProperty({ example: 'success' })
  @IsString()
  @Expose()
  message!: string;

  @ApiProperty({ example: null, nullable: true, type: Object })
  @IsOptional()
  @Expose()
  error!: unknown | null;

  @ApiProperty({
    type: Object,
    example: { result: 'pong' },
    nullable: true,
    description: 'Provider payload',
  })
  @IsOptional()
  @Expose()
  data!: Record<string, unknown> | T | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  @Expose()
  hasNextPage!: boolean;
}
