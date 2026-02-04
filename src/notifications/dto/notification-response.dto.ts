import { Exclude, Expose, Type } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ObjectData } from '../../utils/types/object.type';
import { NotificationCategory } from '../types/notification-enum.type';
import { DeviceAdminResponseDto } from '../../devices/dto/device-response.dto';

@Exclude()
export class NotificationResponseDto {
  @ApiProperty({
    enum: NotificationCategory,
    default: NotificationCategory.GENERAL,
    nullable: false,
  })
  @IsEnum(NotificationCategory)
  @Expose({ groups: ['admin', 'user'] })
  category?: NotificationCategory = NotificationCategory.GENERAL;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    default: false,
  })
  @IsBoolean()
  @Expose({ groups: ['admin', 'user'] })
  isRead?: boolean = false;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    default: false,
  })
  @IsBoolean()
  @Expose({ groups: ['admin', 'user'] })
  isDelivered?: boolean = false;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @Expose({ groups: ['admin', 'user'] })
  data?: ObjectData<any>;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose({ groups: ['admin', 'user'] })
  topic: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose({ groups: ['admin', 'user'] })
  message: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose({ groups: ['admin', 'user'] })
  title: string;

  @ApiPropertyOptional({
    type: () => DeviceAdminResponseDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceAdminResponseDto)
  @Expose({ groups: ['admin', 'user'] })
  device?: DeviceAdminResponseDto;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @Expose({ groups: ['admin', 'user'] })
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  @Expose({ groups: ['admin', 'user'] })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  @Expose({ groups: ['admin', 'user'] })
  updatedAt: Date;
}
