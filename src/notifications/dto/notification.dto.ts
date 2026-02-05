import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Exclude()
export class NotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  id: string;
}
