import { Exclude, Expose } from 'class-transformer';
import { FileType } from '../../files/domain/file';
import { Role } from '../../roles/domain/role';
import { Status } from '../../statuses/domain/status';
import { ApiProperty } from '@nestjs/swagger';
import { SerializeGroups } from '../../utils/transformers/enum.transformer';
import { RoleEnum } from '../../roles/roles.enum';

const idType = Number;

export class User {
  @ApiProperty({
    type: idType,
  })
  id: number | string;

  @ApiProperty({
    type: String,
    example: 'john.doe@example.com',
  })
  @Expose(SerializeGroups([RoleEnum.user, RoleEnum.admin]))
  email: string | null;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @ApiProperty({
    type: String,
    example: 'email',
  })
  @Expose(SerializeGroups([RoleEnum.user, RoleEnum.admin]))
  provider: string;

  @ApiProperty({
    type: String,
    example: '1234567890',
  })
  @Expose(SerializeGroups([RoleEnum.user, RoleEnum.admin]))
  socialId?: string | null;

  @ApiProperty({
    type: String,
    example: 'vero-user-id',
  })
  veroId?: string | null;

  @ApiProperty({
    type: String,
    example: 'John',
  })
  firstName: string | null;

  @ApiProperty({
    type: String,
    example: 'Doe',
  })
  lastName: string | null;

  @ApiProperty({
    type: () => FileType,
  })
  photo?: FileType | null;

  @ApiProperty({
    type: () => Role,
  })
  role?: Role | null;

  @ApiProperty({
    type: () => Status,
  })
  status?: Status;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
