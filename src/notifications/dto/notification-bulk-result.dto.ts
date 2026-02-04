import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

@Exclude()
export class NotificationBulkResultDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  @Expose({ groups: ['admin', 'user'] })
  affected: number;
}
