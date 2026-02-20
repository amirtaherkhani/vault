import {
  // decorators here

  IsBoolean,
  IsInt,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  IsUUID,
  IsArray,
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
    type: () => Boolean,
  })
  @IsOptional()
  @IsBoolean()
  eligible?: boolean;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class StrigaUserKycRejectionCommentsDto {
  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  userComment?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  autoComment?: string | null;
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
    type: () => Number,
  })
  @IsOptional()
  @IsInt()
  currentTier?: number | null;

  @ApiProperty({
    required: false,
    type: () => [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  details?: string[] | null;

  @ApiProperty({
    required: false,
    type: () => Boolean,
  })
  @IsOptional()
  @IsBoolean()
  rejectionFinal?: boolean | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiProperty({
    required: false,
    type: () => Number,
  })
  @IsOptional()
  @IsInt()
  ts?: number | null;

  @ApiProperty({
    required: false,
    type: () => Boolean,
  })
  @IsOptional()
  @IsBoolean()
  tinCollected?: boolean | null;

  @ApiProperty({
    required: false,
    type: () => String,
  })
  @IsOptional()
  @IsString()
  tinVerificationExpiryDate?: string | null;

  @ApiProperty({
    required: false,
    type: () => StrigaUserKycRejectionCommentsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycRejectionCommentsDto)
  rejectionComments?: StrigaUserKycRejectionCommentsDto | null;

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
