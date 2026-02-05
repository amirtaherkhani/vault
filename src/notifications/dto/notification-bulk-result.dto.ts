import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Exclude()
export class NotificationBulkResultDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(0)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  affected: number;
}
