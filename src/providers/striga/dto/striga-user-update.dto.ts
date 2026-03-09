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
  StrigaAddressDto,
  StrigaDateOfBirthDto,
  StrigaExternalIdRequestDto,
  StrigaMobileDto,
} from './striga-base.request.dto';

@Exclude()
export class StrigaUpdateUserForMeDto {
  @ApiPropertyOptional({ type: () => StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  @Expose()
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: () => StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  @Expose()
  address?: StrigaAddressDto;

  @ApiPropertyOptional({ type: () => StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  @Expose()
  dateOfBirth?: StrigaDateOfBirthDto;
}

@Exclude()
export class StrigaUpdateUserForAdminDto extends StrigaUpdateUserForMeDto {
  @ApiProperty({
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'Striga provider user Id',
    format: 'uuid',
  })
  @IsString()
  @IsUUID('4')
  @Expose()
  externalId!: string;
}

@Exclude()
export class StrigaUpdateCredentialsForAdminDto extends StrigaExternalIdRequestDto {
  @ApiProperty({
    example: 'user1@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @Expose()
  email!: string;
}
