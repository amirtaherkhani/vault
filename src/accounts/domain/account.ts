import { User } from '../../users/domain/user';
import { ApiProperty } from '@nestjs/swagger';
import {
  AccountProviderName,
  AccountStatus,
  KycStatus,
} from '../types/account-enum.type';

export class Account {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  customerRefId!: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    enum: KycStatus,
    default: KycStatus.PENDING,
    nullable: false,
  })
  kycStatus?: KycStatus = KycStatus.PENDING;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  label?: string | null;

  @ApiProperty({
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
    nullable: false,
  })
  status?: AccountStatus = AccountStatus.ACTIVE;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  accountId: string;

  @ApiProperty({
    enum: AccountProviderName,
    nullable: false,
  })
  providerName: AccountProviderName;

  @ApiProperty({
    type: () => User,
    nullable: false,
  })
  user: User;

  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
