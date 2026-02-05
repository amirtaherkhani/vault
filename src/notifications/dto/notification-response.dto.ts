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
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Exclude()
export class NotificationResponseDto {
  @ApiProperty({
    enum: NotificationCategory,
    default: NotificationCategory.GENERAL,
    nullable: false,
  })
  @IsEnum(NotificationCategory)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  category?: NotificationCategory = NotificationCategory.GENERAL;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    default: false,
  })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  isRead?: boolean = false;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
    default: false,
  })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  isDelivered?: boolean = false;

  @ApiPropertyOptional({
    type: Object,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  data?: ObjectData<any>;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  topic: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  message: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  title: string;

  @ApiPropertyOptional({
    type: () => DeviceAdminResponseDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceAdminResponseDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  device?: DeviceAdminResponseDto;

  @ApiProperty({
    type: String,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  id: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDateString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  updatedAt: Date;
}
