import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@Exclude()
export class SessionDto {
  @ApiProperty({
    description: 'Unique identifier for the session',
    oneOf: [{ type: 'number' }, { type: 'string' }],
    example: 123,
  })
  @IsNotEmpty()
  @Expose()
  id: number | string;

  @ApiPropertyOptional({
    description: 'Client device name',
    type: () => String,
    nullable: true,
    example: 'iPhone 15 Pro',
  })
  @IsOptional()
  @IsString()
  @Expose()
  deviceName?: string | null;

  @ApiPropertyOptional({
    description: 'Client device type or model',
    type: () => String,
    nullable: true,
    example: 'iPhone',
  })
  @IsOptional()
  @IsString()
  @Expose()
  deviceType?: string | null;

  @ApiPropertyOptional({
    description: 'Application version running on the device',
    type: () => String,
    nullable: true,
    example: '2.4.1',
  })
  @IsOptional()
  @IsString()
  @Expose()
  appVersion?: string | null;

  @ApiPropertyOptional({
    description: 'Country inferred from IP or device locale',
    type: () => String,
    nullable: true,
    example: 'US',
  })
  @IsOptional()
  @IsString()
  @Expose()
  country?: string | null;

  @ApiPropertyOptional({
    description: 'City inferred from IP or device locale',
    type: () => String,
    nullable: true,
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString()
  @Expose()
  city?: string | null;

  @ApiPropertyOptional({
    description: 'Last activity timestamp for the session',
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2025-07-15T12:45:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Expose()
  lastUsedAt?: Date | null;

  @ApiProperty({
    description: 'Session creation timestamp',
    type: String,
    format: 'date-time',
    example: '2025-07-14T18:20:00Z',
  })
  @IsDateString()
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp for the session',
    type: String,
    format: 'date-time',
    example: '2025-07-15T12:45:00Z',
  })
  @IsDateString()
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Whether this is the current active session',
    type: () => Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  current?: boolean;
}
