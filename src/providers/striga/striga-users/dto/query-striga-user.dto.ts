import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class FilterStrigaUsersDto {
  @ApiPropertyOptional({
    description: 'Striga external user ID',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;
}

export class StrigaUsersByIdsQueryDto {
  @ApiPropertyOptional({
    description: 'Comma-separated list of local Striga user IDs',
    example:
      '8fa4f6ef-9e76-4cb2-97cb-1401e24e58f5,5db2f0cb-ef0c-4a1d-8577-6d3ebf4a8fc8',
    type: String,
  })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value ?? '')
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v.length > 0),
  )
  @IsArray()
  @IsString({ each: true })
  ids!: string[];
}
