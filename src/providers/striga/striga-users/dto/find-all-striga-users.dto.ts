import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

@Exclude()
export class FindAllStrigaUsersDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Page number',
  })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  @Expose()
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    minimum: 1,
    maximum: 50,
    description: 'Page size',
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Expose()
  limit?: number;
}
