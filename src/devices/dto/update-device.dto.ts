import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseCreateDeviceDto } from './create-device.dto';
import { UserDto } from '../../users/dto/user.dto';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class UpdateDeviceDto extends PartialType(BaseCreateDeviceDto) {
  @ApiPropertyOptional({ type: () => UserDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserDto)
  user?: UserDto;
}

export class UpdateDeviceTokenDto {
  @ApiProperty({ required: true, type: () => String })
  @IsString()
  deviceToken: string;
}

export class UpdateDeviceStatusDto {
  @ApiProperty({ required: true, type: () => Boolean })
  @IsBoolean()
  isActive: boolean;
}
