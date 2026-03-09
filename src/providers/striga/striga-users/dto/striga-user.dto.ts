import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  StrigaUserAddressDto,
  StrigaUserDateOfBirthDto,
  StrigaUserKycDto,
  StrigaUserMobileDto,
} from './create-striga-user.dto';

@Exclude()
export class StrigaUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '8fa4f6ef-9e76-4cb2-97cb-1401e24e58f5',
    description: 'Local Striga user record Id',
  })
  @IsUUID()
  @Expose()
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'External Striga user Id',
  })
  @IsUUID()
  @Expose()
  externalId!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  @IsEmail()
  @Expose()
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @Expose()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @Expose()
  lastName!: string;

  @ApiProperty({
    type: () => StrigaUserMobileDto,
    description: 'User mobile',
  })
  @ValidateNested()
  @Type(() => StrigaUserMobileDto)
  @Expose()
  mobile!: StrigaUserMobileDto;

  @ApiProperty({
    type: () => StrigaUserAddressDto,
    description: 'User address',
  })
  @ValidateNested()
  @Type(() => StrigaUserAddressDto)
  @Expose()
  address!: StrigaUserAddressDto;

  @ApiPropertyOptional({
    type: () => StrigaUserDateOfBirthDto,
    nullable: true,
    description: 'User date of birth',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserDateOfBirthDto)
  @Expose()
  dateOfBirth?: StrigaUserDateOfBirthDto | null;

  @ApiPropertyOptional({
    type: () => StrigaUserKycDto,
    nullable: true,
    description: 'Minimal KYC snapshot',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycDto)
  @Expose()
  kyc?: StrigaUserKycDto | null;

  @ApiPropertyOptional({
    example: '2026-02-21T11:25:30.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    example: '2026-02-21T11:25:30.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @Expose()
  updatedAt?: Date;
}
