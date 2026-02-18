import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  StrigaUserAddressDto,
  StrigaUserMobileDto,
} from './create-striga-user.dto';

export class StrigaUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  externalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ type: () => StrigaUserMobileDto })
  @ValidateNested()
  @Type(() => StrigaUserMobileDto)
  mobile!: StrigaUserMobileDto;

  @ApiProperty({ type: () => StrigaUserAddressDto })
  @ValidateNested()
  @Type(() => StrigaUserAddressDto)
  address!: StrigaUserAddressDto;
}
