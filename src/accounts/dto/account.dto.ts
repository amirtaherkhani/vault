import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';
import { UserDto } from '../../users/dto/user.dto';
import {
  AccountProviderName,
  AccountStatus,
  KycStatus,
} from '../types/account-enum.type';
import { RoleEnum } from '../../roles/roles.enum';
import { RoleGroups } from '../../utils/transformers/enum.transformer';

@Exclude()
export class AccountDto {
  @ApiProperty({
    description: 'Unique identifier for the account record',
    format: 'uuid',
  })
  @IsUUID()
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Customer reference identifier provided by upstream systems',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  customerRefId?: string | null;

  @ApiPropertyOptional({
    description: 'Display name for the account',
    type: String,
  })
  @IsOptional()
  @IsString()
  @Expose()
  name?: string | null;

  @ApiProperty({
    description: 'KYC status synced from the provider',
    enum: KycStatus,
    example: KycStatus.VERIFIED,
  })
  @IsEnum(KycStatus)
  @Expose()
  kycStatus: KycStatus;

  @ApiPropertyOptional({
    description: 'Label displayed in the UI',
    example: 'Main Binance Account',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Expose(RoleGroups([RoleEnum.user, RoleEnum.admin]))
  label?: string | null;

  @ApiProperty({
    description: 'Operational status of the account record',
    enum: AccountStatus,
  })
  @IsEnum(AccountStatus)
  @Expose()
  status: AccountStatus;

  @ApiProperty({
    description: 'Provider-side account Id',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  @Expose()
  accountId: string;

  @ApiProperty({
    description: 'Provider name registered in the platform',
    enum: AccountProviderName,
  })
  @IsEnum(AccountProviderName)
  @Expose()
  providerName: AccountProviderName;

  @ApiProperty({
    description: 'Account owner (visible to admins only)',
    type: () => UserDto,
  })
  @ValidateNested()
  @Type(() => UserDto)
  @Expose(RoleGroups([RoleEnum.admin]))
  user: UserDto;

  @ApiProperty({
    description: 'Creation timestamp',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  @Expose()
  updatedAt: Date;
}
