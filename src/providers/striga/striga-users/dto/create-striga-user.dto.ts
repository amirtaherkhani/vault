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

  // Don't forget to use the class-validator decorators in the DTO properties.
}
