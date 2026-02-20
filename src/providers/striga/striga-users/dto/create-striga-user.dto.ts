import {
  // decorators here

  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import {
  // decorators here
  ApiProperty,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StrigaUserMobileDto {
  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  countryCode!: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  number!: string;
}

export class StrigaUserAddressDto {
  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  addressLine1!: string;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  addressLine2?: string | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  city!: string;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  state?: string | null;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  country!: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  postalCode!: string;
}

export class StrigaUserKycTierDto {
  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class StrigaUserKycDto {
  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  status?: string | null;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycTierDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  tier0?: StrigaUserKycTierDto | null;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycTierDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  tier1?: StrigaUserKycTierDto | null;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycTierDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  tier2?: StrigaUserKycTierDto | null;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycTierDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierDto)
  tier3?: StrigaUserKycTierDto | null;
}

export class CreateStrigaUserDto {
  @ApiProperty({
    required: true,
    type: () => String,
    format: 'uuid',
  })
  @IsUUID()
  externalId!: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  email: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    required: true,
    type: () => String,
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    required: true,
    type: () => StrigaUserMobileDto,
  })
  @ValidateNested()
  @Type(() => StrigaUserMobileDto)
  @IsNotEmptyObject()
  mobile!: StrigaUserMobileDto;

  @ApiProperty({
    required: true,
    type: () => StrigaUserAddressDto,
  })
  @ValidateNested()
  @Type(() => StrigaUserAddressDto)
  @IsNotEmptyObject()
  address!: StrigaUserAddressDto;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycDto)
  kyc?: StrigaUserKycDto | null;

  // Don't forget to use the class-validator decorators in the DTO properties.
}
