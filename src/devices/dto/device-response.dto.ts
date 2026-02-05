import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NotificationDto } from '../../notifications/dto/notification.dto';
import { UserDto } from '../../users/dto/user.dto';
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Exclude()
class DeviceBaseResponseDto {
  @ApiPropertyOptional({
    type: () => [NotificationDto],
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  notifications?: NotificationDto[] | null;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  isActive?: boolean;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  model: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  appVersion: string;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  osVersion?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  platform: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  deviceToken: string;

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

@Exclude()
export class DeviceAdminResponseDto extends DeviceBaseResponseDto {
  @ApiProperty({
    type: () => UserDto,
    nullable: false,
  })
  @ValidateNested()
  @Type(() => UserDto)
  @Expose(RoleGroups([RoleEnum.admin]))
  user: UserDto;
}

@Exclude()
export class DeviceUserResponseDto extends DeviceBaseResponseDto {}
