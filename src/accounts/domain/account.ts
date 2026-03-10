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
  customerRefId!: string | null; // This is the reference ID provided (User Id) by the account provider, which can be used to link the account to the provider's system.

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
  accountId: string; // This is the unique identifier for the account within provider system, which can be used to reference the account in provider cloud storage and operations.

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
  id: string; // This is the unique identifier for the account within our system, which can be used to reference the account in our database and operations.

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
