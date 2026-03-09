import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@Exclude()
export class FilterStrigaUsersDto {
  @ApiPropertyOptional({
    description: 'Striga external user Id',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  @Expose()
  externalId?: string;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'First name',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @Expose()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @Expose()
  lastName?: string;
}

@Exclude()
export class StrigaUsersByIdsQueryDto {
  @ApiProperty({
    description: 'Comma-separated list of local Striga user Ids',
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
  @IsUUID('4', { each: true })
  @Expose()
  ids!: string[];
}

@Exclude()
export class StrigaUserByUserIdParamDto {
  @ApiProperty({
    description: 'Application user Id',
    example: 1,
    minimum: 1,
    type: Number,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Expose()
  userId!: number;
}
