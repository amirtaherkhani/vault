import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

@Exclude()
export class NotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose({ groups: ['admin', 'user'] })
  id: string;
}
