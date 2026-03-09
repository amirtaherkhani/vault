import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  Max,
  Matches,
  MaxLength,
  Min,
  MinLength,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class StrigaMobileDto {
  @ApiProperty({ example: '+372' })
  @IsString()
  countryCode!: string;

  @ApiProperty({ example: '56272888' })
  @IsString()
  number!: string;
}

export class StrigaDateOfBirthDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  month!: number;

  @ApiProperty({ example: 15 })
  @Type(() => Number)
  @IsInt()
  day!: number;

  @ApiProperty({ example: 2000 })
  @Type(() => Number)
  @IsInt()
  year!: number;
}

export class StrigaAddressDto {
  @ApiProperty({ example: 'Lootsa 1' })
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Hajumaa' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Tallinn' })
  @IsString()
  city!: string;

  @ApiPropertyOptional({ example: 'Tallinn' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: 'EE' })
  @IsString()
  country!: string;

  @ApiProperty({ example: '10118' })
  @IsString()
  postalCode!: string;
}

export class StrigaCreateUserRequestDto {
  @ApiProperty({ example: 'Miguel' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Kristina Hermiston' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'Ismael_Kulas93@example.net' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ type: StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  dateOfBirth?: StrigaDateOfBirthDto;

  @ApiPropertyOptional({ type: StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  address?: StrigaAddressDto;
}

export type StrigaGetWalletAccountRequestDto = Record<string, unknown>;
export class StrigaGetWalletAccountStatementRequestDto {
  @ApiProperty({ example: '65fbc66a-1898-4df7-82bc-f9ec464585fd' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: '244337fcf5b13ff40f7780bdd3e66d30' })
  @IsString()
  accountId!: string;

  @ApiProperty({ example: 1732703202876, description: 'UNIX epoch ms' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startDate!: number;

  @ApiProperty({ example: 1735305202876, description: 'UNIX epoch ms' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  endDate!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page!: number;

  @ApiPropertyOptional({ example: 10, description: 'Max 100; default 10' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
export type StrigaGetAllWalletsRequestDto = Record<string, unknown>;
export type StrigaGetWalletRequestDto = Record<string, unknown>;
export type StrigaCreateWalletRequestDto = Record<string, unknown>;

export class StrigaGetAccountTransactionsByIdRequestDto {
  @ApiProperty({ description: 'Striga user id', example: '65fbc66a-1898-4df7-82bc-f9ec464585fd' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Striga account id (wallet sub-account)', example: 'd8a8c7c7ceeec2c221971febd00d5685' })
  @IsString()
  accountId!: string;

  @ApiProperty({ description: 'Transaction UUID', example: '5f6b6711-fdb0-4aee-bc60-ed49bd74b575' })
  @IsString()
  txId!: string;
}

export enum StrigaCreateCardType {
  VIRTUAL = 'VIRTUAL',
}

export class StrigaCardDeliveryAddressDto {
  @ApiProperty({ example: '53338 Aurelie Mount' })
  @IsString()
  addressLine1!: string;

  @ApiPropertyOptional({ example: '59880 Coy Club' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: '11030' })
  @IsString()
  postalCode!: string;

  @ApiProperty({ example: 'Medhurstfort' })
  @IsString()
  city!: string;

  @ApiProperty({ example: 'EE' })
  @IsString()
  countryCode!: string;

  @ApiPropertyOptional({ example: 'TRACKED' })
  @IsOptional()
  @IsString()
  dispatchMethod?: string;
}

export class StrigaCardPhysicalDeliveryFeesDto {
  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  express?: number;
}

export class StrigaCardPhysicalOverrideFeeDto {
  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  creationFee?: number;

  @ApiPropertyOptional({ type: () => StrigaCardPhysicalDeliveryFeesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardPhysicalDeliveryFeesDto)
  deliveryFees?: StrigaCardPhysicalDeliveryFeesDto;
}

export class StrigaCardOverrideFeeDto {
  @ApiPropertyOptional({ type: () => StrigaCardPhysicalOverrideFeeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardPhysicalOverrideFeeDto)
  physical?: StrigaCardPhysicalOverrideFeeDto;
}

export class StrigaCreateCardRequestDto {
  @ApiProperty({
    example: 'c1d2340e-89ef-4385-9104-e24363058ad6',
    description: 'Striga user Id',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    example: 'Vesta Turner',
    description: 'Name printed on card',
  })
  @IsString()
  nameOnCard!: string;

  @ApiProperty({
    enum: StrigaCreateCardType,
    example: StrigaCreateCardType.VIRTUAL,
    description: 'Only virtual cards are supported in this integration.',
  })
  @IsEnum(StrigaCreateCardType)
  type!: StrigaCreateCardType;

  @ApiProperty({
    example: 'Pass1234TestTest@!',
    description: '3DS password',
  })
  @IsString()
  threeDSecurePassword!: string;

  @ApiPropertyOptional({
    type: () => StrigaCardDeliveryAddressDto,
    description: 'Required only for physical cards in Striga API.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardDeliveryAddressDto)
  address?: StrigaCardDeliveryAddressDto;

  @ApiPropertyOptional({
    example: '9ac77e120ef8c9dcd92abedbfe994bc5',
    description: 'Account to link card to. If omitted, Striga defaults apply.',
  })
  @IsOptional()
  @IsString()
  accountIdToLink?: string;

  @ApiPropertyOptional({
    example: 'STD001',
    description: 'Physical-card design selector in Striga production.',
  })
  @IsOptional()
  @IsString()
  personalizationCode?: string;

  @ApiPropertyOptional({ type: () => StrigaCardOverrideFeeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardOverrideFeeDto)
  overrideFee?: StrigaCardOverrideFeeDto;
}

export class StrigaCardIdRequestDto {
  @ApiProperty({
    example: 'eb7da407-ae11-40a4-ad22-aa74be87ecb2',
    description: 'Striga card Id',
  })
  @IsString()
  cardId!: string;
}

export class StrigaLinkCardAccountRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({
    example: '22eb9caee08de8410eb0b41c5afd249e',
    description: 'Striga account Id to link',
  })
  @IsString()
  accountId!: string;
}

export class StrigaBurnCardRequestDto extends StrigaCardIdRequestDto {}

export class StrigaBlockCardRequestDto extends StrigaCardIdRequestDto {}

const STRIGA_CARD_PIN_REGEX =
  /^(?!.*(\d)\1)(?!.*(?:0123|1234|2345|3456|4567|5678|6789|7890|0987|9876|8765|7654|6543|5432|4321|3210))\d{4}$/;
const STRIGA_THREE_D_SECURE_PASSWORD_REGEX =
  /^[A-Za-z0-9!"#;:?&*()+=\/\\,.\[\]{}]+$/;

export class StrigaUpdateCard3dsRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({
    example: 'Pass1234TestTest@!',
    description:
      '8-36 characters. Allowed charset: A-Z a-z 0-9 ! " # ; : ? & * ( ) + = / \\ , . [ ] { }',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(36)
  @Matches(STRIGA_THREE_D_SECURE_PASSWORD_REGEX)
  threeDSecurePassword!: string;
}

export class StrigaSetCardPinRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({
    example: '4826',
    description:
      'Strong 4-digit PIN. No repeating digits and no sequential digits.',
  })
  @IsString()
  @Matches(STRIGA_CARD_PIN_REGEX)
  pin!: string;
}

export class StrigaCardSecuritySettingsRequestDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  contactlessEnabled!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  withdrawalEnabled!: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  internetPurchaseEnabled!: boolean;
}

export class StrigaUpdateCardSecurityRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({ type: () => StrigaCardSecuritySettingsRequestDto })
  @ValidateNested()
  @Type(() => StrigaCardSecuritySettingsRequestDto)
  security!: StrigaCardSecuritySettingsRequestDto;
}

export class StrigaCardLimitsRequestDto {
  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dailyPurchase?: number;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dailyWithdrawal?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dailyInternetPurchase?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dailyContactlessPurchase?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weeklyPurchase?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weeklyWithdrawal?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weeklyInternetPurchase?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weeklyContactlessPurchase?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  monthlyPurchase?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  monthlyWithdrawal?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  monthlyInternetPurchase?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  monthlyContactlessPurchase?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  transactionPurchase?: number;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  transactionWithdrawal?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  transactionInternetPurchase?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  transactionContactlessPurchase?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dailyOverallPurchase?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  weeklyOverallPurchase?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  monthlyOverallPurchase?: number;
}

export class StrigaUpdateCardLimitsRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({ type: () => StrigaCardLimitsRequestDto })
  @ValidateNested()
  @Type(() => StrigaCardLimitsRequestDto)
  limits!: StrigaCardLimitsRequestDto;
}

export class StrigaGetCardStatementRequestDto extends StrigaCardIdRequestDto {
  @ApiProperty({
    example: 1732703202876,
    description: 'UNIX epoch timestamp in milliseconds',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  startDate!: number;

  @ApiProperty({
    example: 1735305202876,
    description: 'UNIX epoch timestamp in milliseconds',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  endDate!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page!: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Maximum items per page. Striga max is 100.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class StrigaPingRequestDto {}

export class StrigaUserIdRequestDto {
  @ApiProperty({
    example: '9fd9f525-cb24-4682-8c5a-aa5c2b7e4dde',
    description: 'User Id returned by Striga create user endpoint',
  })
  @IsString()
  userId!: string;
}

export class StrigaGetCardsByUserRequestDto extends StrigaUserIdRequestDto {
  @ApiProperty({
    example: 10,
    description: 'Required. Maximum items per page. Striga max is 100.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit!: number;

  @ApiProperty({
    example: 0,
    description: 'Required. Pagination offset. Use 0 for first page.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset!: number;
}

export class StrigaUpdateUserRequestDto extends PartialType(
  StrigaCreateUserRequestDto,
) {
  @ApiPropertyOptional({
    example: '9fd9f525-cb24-4682-8c5a-aa5c2b7e4dde',
    description: 'User Id returned by Striga create user endpoint',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: 'Janiyaburgh' })
  @IsOptional()
  @IsString()
  placeOfBirth?: string;
}

export class StrigaUpdateVerifiedCredentialsRequestDto extends StrigaUserIdRequestDto {
  @ApiProperty({
    example: 'user1@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;
}

export class StrigaEmailRequestDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  email!: string;
}

export class StrigaUserByEmailRequestDto extends StrigaEmailRequestDto {}

export class StrigaExternalIdRequestDto {
  @ApiProperty({
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'Striga user Id',
  })
  @IsString()
  externalId!: string;
}

export class StrigaVerifyEmailRequestDto extends StrigaUserIdRequestDto {
  @ApiProperty({
    example: '123456',
    description: '6 character code. Sandbox default is 123456.',
  })
  @IsString()
  verificationId!: string;
}

export class StrigaResendEmailRequestDto extends StrigaUserIdRequestDto {}

export class StrigaVerifyMobileRequestDto extends StrigaUserIdRequestDto {
  @ApiProperty({
    example: '123456',
    description: '6 character code. Sandbox default is 123456.',
  })
  @IsString()
  verificationCode!: string;
}

export class StrigaResendSmsRequestDto extends StrigaUserIdRequestDto {}

export type StrigaKycRequestDto = Record<string, unknown>;
