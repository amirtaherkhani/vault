import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

@Exclude()
export class StrigaUserMobileDto {
  @ApiProperty({
    example: '+372',
    description: 'Phone country code',
  })
  @IsString()
  @Expose()
  countryCode!: string;

  @ApiProperty({
    example: '56316716',
    description: 'Phone number without country code',
  })
  @IsString()
  @Expose()
  number!: string;
}

@Exclude()
export class StrigaUserAddressDto {
  @ApiProperty({
    example: 'Sepapaja 12',
    description: 'Primary street line',
  })
  @IsString()
  @Expose()
  addressLine1!: string;

  @ApiPropertyOptional({
    example: 'Hajumaa',
    description: 'Secondary address line',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  addressLine2?: string | null;

  @ApiProperty({
    example: 'Tallinn',
    description: 'City',
  })
  @IsString()
  @Expose()
  city!: string;

  @ApiPropertyOptional({
    example: 'Tallinn',
    description: 'State or region',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  state?: string | null;

  @ApiProperty({
    example: 'EE',
    description: 'ISO country code',
  })
  @IsString()
  @Expose()
  country!: string;

  @ApiProperty({
    example: '11412',
    description: 'Postal code',
  })
  @IsString()
  @Expose()
  postalCode!: string;
}

@Exclude()
export class StrigaUserKycTierDto {
  @ApiPropertyOptional({
    example: 'APPROVED',
    description: 'Tier KYC status',
  })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string;
}

@Exclude()
export class StrigaUserKycDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Email verification status from provider',
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  emailVerified?: boolean | null;

  @ApiPropertyOptional({
    example: false,
    description: 'Mobile verification status from provider',
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  mobileVerified?: boolean | null;

  @ApiPropertyOptional({
    example: 'PENDING_REVIEW',
    description: 'Overall KYC status',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string | null;

  @ApiPropertyOptional({
    type: () => StrigaUserKycTierDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  @Expose()
  tier0?: StrigaUserKycTierDto | null;

  @ApiPropertyOptional({
    type: () => StrigaUserKycTierDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  @Expose()
  tier1?: StrigaUserKycTierDto | null;

  @ApiPropertyOptional({
    type: () => StrigaUserKycTierDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  @Expose()
  tier2?: StrigaUserKycTierDto | null;

  @ApiPropertyOptional({
    type: () => StrigaUserKycTierDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  @Expose()
  tier3?: StrigaUserKycTierDto | null;
}

@Exclude()
export class CreateStrigaUserDto {
  @ApiProperty({
    format: 'uuid',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'Striga user ID',
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
    description: 'User mobile details',
  })
  @ValidateNested()
  @Type(() => StrigaUserMobileDto)
  @IsNotEmptyObject()
  @Expose()
  mobile!: StrigaUserMobileDto;

  @ApiProperty({
    type: () => StrigaUserAddressDto,
    description: 'User address details',
  })
  @ValidateNested()
  @Type(() => StrigaUserAddressDto)
  @IsNotEmptyObject()
  @Expose()
  address!: StrigaUserAddressDto;

  @ApiPropertyOptional({
    type: () => StrigaUserKycDto,
    nullable: true,
    description: 'Minimal KYC snapshot stored locally',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycDto)
  @Expose()
  kyc?: StrigaUserKycDto | null;
}
