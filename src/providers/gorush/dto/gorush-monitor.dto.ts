import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class GoRushSystemStatsResponseDto {
  @ApiProperty({ description: 'Process ID' })
  @IsInt()
  @Expose()
  pid: number;

  @ApiPropertyOptional({ description: 'Hostname of the server' })
  @IsString()
  @IsOptional()
  @Expose()
  hostname?: string;

  @ApiProperty({ description: 'Server uptime in human-readable format' })
  @IsString()
  @Expose()
  uptime: string;

  @ApiProperty({ description: 'Server uptime in seconds' })
  @IsInt()
  @Expose()
  uptime_sec: number;

  @ApiProperty({ description: 'Current server time' })
  @IsString()
  @Expose()
  time: string;

  @ApiProperty({ description: 'Current Unix timestamp' })
  @IsInt()
  @Expose()
  unixtime: number;

  @ApiProperty({
    description: 'Count of HTTP status codes in the current session',
  })
  @IsObject()
  @Expose()
  status_code_count: Record<string, number>;

  @ApiProperty({
    description: 'Total count of HTTP status codes since startup',
  })
  @IsObject()
  @Expose()
  total_status_code_count: Record<string, number>;

  @ApiProperty({ description: 'Number of requests in the current session' })
  @IsInt()
  @Expose()
  count: number;

  @ApiProperty({ description: 'Total number of requests since startup' })
  @IsInt()
  @Expose()
  total_count: number;

  @ApiProperty({ description: 'Total response time in human-readable format' })
  @IsString()
  @Expose()
  total_response_time: string;

  @ApiProperty({ description: 'Total response time in seconds' })
  @IsInt()
  @Expose()
  total_response_time_sec: number;

  @ApiProperty({ description: 'Total response size in bytes' })
  @IsInt()
  @Expose()
  total_response_size: number;

  @ApiProperty({ description: 'Average response size in bytes' })
  @IsInt()
  @Expose()
  average_response_size: number;

  @ApiProperty({
    description: 'Average response time in human-readable format',
  })
  @IsString()
  @Expose()
  average_response_time: string;

  @ApiProperty({ description: 'Average response time in seconds' })
  @IsInt()
  @Expose()
  average_response_time_sec: number;

  @ApiPropertyOptional({ description: 'Total metric counts' })
  @IsObject()
  @IsOptional()
  @Expose()
  total_metrics_counts?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Average metric timers' })
  @IsObject()
  @IsOptional()
  @Expose()
  average_metrics_timers?: Record<string, number>;
}

@Exclude()
export class GoRushMetricsResponseDto {
  @ApiProperty({ description: 'All metrics for the prometheus metrics' })
  @IsString()
  @Expose()
  metrics: string;
}

@Exclude()
export class GoRushMetricsJsonResponseDto {
  @ApiProperty({ description: 'Structured JSON of Gorush metrics' })
  @IsString()
  @Expose()
  metrics: Record<string, any>;
}

@Exclude()
export class PushStatsDto {
  @ApiProperty()
  @IsInt()
  @Expose()
  push_success: number;

  @ApiProperty()
  @IsInt()
  @Expose()
  push_error: number;
}

@Exclude()
export class GoRushAppStatusResponseDto {
  @ApiProperty()
  @IsString()
  @Expose()
  version: string;

  @ApiProperty()
  @IsInt()
  @Expose()
  busy_workers: number;

  @ApiProperty()
  @IsInt()
  @Expose()
  success_tasks: number;

  @ApiProperty()
  @IsInt()
  @Expose()
  failure_tasks: number;

  @ApiProperty()
  @IsInt()
  @Expose()
  submitted_tasks: number;

  @ApiProperty()
  @IsInt()
  @Expose()
  total_count: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushStatsDto)
  @IsObject()
  @Expose()
  ios: PushStatsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushStatsDto)
  @IsObject()
  @Expose()
  android: PushStatsDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => PushStatsDto)
  @IsObject()
  @Expose()
  huawei: PushStatsDto;
}
