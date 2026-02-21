import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@Exclude()
export class StrigaUserIdParamDto {
  @ApiProperty({
    description: 'Unique user ID from Striga',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
  })
  @IsString()
  @Expose()
  userId!: string;
}

@Exclude()
export class StrigaMobileDto {
  @ApiProperty({ example: '+372' })
  @IsString()
  @Expose()
  countryCode!: string;

  @ApiProperty({ example: '56272888' })
  @IsString()
  @Expose()
  number!: string;
}

@Exclude()
export class StrigaDateOfBirthDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Expose()
  month!: number;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  @Expose()
  day!: number;

  @ApiProperty({ example: 2000 })
  @Type(() => Number)
  @IsInt()
  @Expose()
  year!: number;
}

@Exclude()
export class StrigaAddressDto {
  @ApiProperty({ example: 'Lootsa 1' })
  @IsString()
  @Expose()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Hajumaa' })
  @IsOptional()
  @IsString()
  @Expose()
  addressLine2?: string;

  @ApiProperty({ example: 'Tallinn' })
  @IsString()
  @Expose()
  city!: string;

  @ApiPropertyOptional({ example: 'Tallinn' })
  @IsOptional()
  @IsString()
  @Expose()
  state?: string;

  @ApiProperty({ example: 'EE' })
  @IsString()
  @Expose()
  country!: string;

  @ApiProperty({ example: '10118' })
  @IsString()
  @Expose()
  postalCode!: string;
}

@Exclude()
export class StrigaCreateUserRequestDto {
  @ApiProperty({ example: 'Miguel' })
  @IsString()
  @Expose()
  firstName!: string;

  @ApiProperty({ example: 'Kristina Hermiston' })
  @IsString()
  @Expose()
  lastName!: string;

  @ApiProperty({ example: 'Ismael_Kulas93@example.net' })
  @IsEmail()
  @Expose()
  email!: string;

  @ApiPropertyOptional({ type: StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  @Expose()
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  @Expose()
  dateOfBirth?: StrigaDateOfBirthDto;

  @ApiPropertyOptional({ type: StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  @Expose()
  address?: StrigaAddressDto;
}

export type StrigaGetWalletAccountRequestDto = Record<string, unknown>;
export type StrigaGetWalletAccountStatementRequestDto = Record<string, unknown>;
export type StrigaGetAllWalletsRequestDto = Record<string, unknown>;
export type StrigaGetWalletRequestDto = Record<string, unknown>;
export type StrigaCreateWalletRequestDto = Record<string, unknown>;

@Exclude()
export class StrigaUpdateUserRequestDto {
  @ApiPropertyOptional({
    example: '9fd9f525-cb24-4682-8c5a-aa5c2b7e4dde',
    description: 'User ID returned by Striga create user endpoint',
  })
  @IsOptional()
  @IsString()
  @Expose()
  userId?: string;

  @ApiPropertyOptional({ example: 'Claudia' })
  @IsOptional()
  @IsString()
  @Expose()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Tracy Lind' })
  @IsOptional()
  @IsString()
  @Expose()
  lastName?: string;

  @ApiPropertyOptional({ example: 'user1@example.com' })
  @IsOptional()
  @IsEmail()
  @Expose()
  email?: string;

  @ApiPropertyOptional({ type: StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  @Expose()
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  @Expose()
  dateOfBirth?: StrigaDateOfBirthDto;

  @ApiPropertyOptional({ type: StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  @Expose()
  address?: StrigaAddressDto;

  @ApiPropertyOptional({ example: 'Janiyaburgh' })
  @IsOptional()
  @IsString()
  @Expose()
  placeOfBirth?: string;
}

@Exclude()
export class StrigaUpdateVerifiedCredentialsRequestDto {
  @ApiProperty({
    example: '9fd9f525-cb24-4682-8c5a-aa5c2b7e4dde',
    description: 'Unique user ID returned by Striga create user endpoint',
  })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({
    example: 'user1@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @Expose()
  email!: string;
}

@Exclude()
export class StrigaUserByEmailRequestDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  @Expose()
  email!: string;
}

@Exclude()
export class StrigaExternalIdRequestDto {
  @ApiProperty({
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'Striga user ID',
  })
  @IsString()
  @Expose()
  externalId!: string;
}

@Exclude()
export class StrigaUserByEmailParamDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  @Expose()
  email!: string;
}

@Exclude()
export class StrigaVerifyEmailRequestDto {
  @ApiProperty({ example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f' })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({
    example: '123456',
    description: '6 character code. Sandbox default is 123456.',
  })
  @IsString()
  @Expose()
  verificationId!: string;
}

@Exclude()
export class StrigaResendEmailRequestDto {
  @ApiProperty({ example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f' })
  @IsString()
  @Expose()
  userId!: string;
}

@Exclude()
export class StrigaVerifyMobileRequestDto {
  @ApiProperty({ example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f' })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({
    example: '123456',
    description: '6 character code. Sandbox default is 123456.',
  })
  @IsString()
  @Expose()
  verificationCode!: string;
}

@Exclude()
export class StrigaResendSmsRequestDto {
  @ApiProperty({ example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f' })
  @IsString()
  @Expose()
  userId!: string;
}

export type StrigaKycRequestDto = Record<string, unknown>;
