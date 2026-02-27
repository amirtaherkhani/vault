import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  StrigaAddressDto,
  StrigaCardLimitsRequestDto,
  StrigaDateOfBirthDto,
  StrigaMobileDto,
} from './striga-base.request.dto';

export class StrigaBaseResponseDto<T = unknown> {
  @ApiProperty({ example: 200 })
  @IsInt()
  status!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({ example: 'success' })
  @IsString()
  message!: string;

  @ApiProperty({ example: null, nullable: true, type: Object })
  @IsOptional()
  error!: unknown | null;

  @ApiProperty({
    type: Object,
    example: { result: 'pong' },
    nullable: true,
    description: 'Provider payload',
  })
  @IsOptional()
  data!: Record<string, unknown> | T | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  hasNextPage!: boolean;
}

export class StrigaPingResponseDto {
  @ApiProperty({ example: 'pong' })
  @IsString()
  result!: string;
}

export class StrigaProviderPayloadResponseDto {
  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  payload!: Record<string, unknown> | null;
}

export class StrigaUserKycTierSummaryResponseDto {
  @ApiPropertyOptional({ example: 'APPROVED' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class StrigaUserKycSummaryResponseDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  mobileVerified?: boolean;

  @ApiPropertyOptional({ example: 'NOT_STARTED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  tier0?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  tier1?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  tier2?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  tier3?: StrigaUserKycTierSummaryResponseDto;
}

export class StrigaVerificationInfoResponseDto {
  @ApiPropertyOptional({
    example: '2024-01-25T04:56:39.745Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  dateExpires?: string;
}

export class StrigaCloudUserResponseDto {
  @ApiProperty()
  @IsString()
  firstName!: string;

  @ApiProperty()
  @IsString()
  lastName!: string;

  @ApiProperty()
  @IsString()
  email!: string;

  @ApiPropertyOptional({ type: () => StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: () => StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  dateOfBirth?: StrigaDateOfBirthDto;

  @ApiPropertyOptional({ type: () => StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  address?: StrigaAddressDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycSummaryResponseDto)
  kyc?: StrigaUserKycSummaryResponseDto;

  @ApiProperty()
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ example: 1706158299688 })
  @IsOptional()
  @IsInt()
  createdAt?: number;

  @ApiPropertyOptional({ type: () => StrigaVerificationInfoResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaVerificationInfoResponseDto)
  emailVerification?: StrigaVerificationInfoResponseDto;

  @ApiPropertyOptional({ type: () => StrigaVerificationInfoResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaVerificationInfoResponseDto)
  mobileVerification?: StrigaVerificationInfoResponseDto;

  @ApiPropertyOptional({ type: () => [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  missingFields?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  tinCollected?: boolean;
}

export class StrigaKycLimitSplitDto {
  @ApiProperty({ example: '0' })
  @IsString()
  all!: string;

  @ApiProperty({ example: '0' })
  @IsString()
  va!: string;
}

export class StrigaKycRejectionCommentsDto {
  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  autoComment?: string;

  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  userComment?: string;

  @ApiPropertyOptional({ example: 'Incorrect company name.' })
  @IsOptional()
  @IsString()
  clientComment?: string;

  @ApiPropertyOptional({
    example:
      'According to the provided documents, the data in the profile is incorrect.',
  })
  @IsOptional()
  @IsString()
  moderationComment?: string;
}

export class StrigaKycTierDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  eligible!: boolean;

  @ApiProperty({ example: 'NOT_STARTED' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  outboundLimitConsumed?: string;

  @ApiPropertyOptional({ example: '1500000' })
  @IsOptional()
  @IsString()
  outboundLimitAllowed?: string;

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  inboundLimitConsumed?: StrigaKycLimitSplitDto;

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  inboundLimitAllowed?: StrigaKycLimitSplitDto;

  @ApiPropertyOptional({
    example: '2024-02-09T10:14:53.996Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  verificationExpiryDate?: string;
}

export class StrigaUserKycStatusDto {
  @ApiProperty({ example: '20ee2b7f-fd9b-4cc1-8dfe-695be722dd45' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 'REJECTED_FINAL' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({
    type: () => [String],
    example: ['WRONG_USER_REGION', 'REGULATIONS_VIOLATIONS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  details?: string[];

  @ApiPropertyOptional({ type: () => StrigaKycRejectionCommentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycRejectionCommentsDto)
  rejectionComments?: StrigaKycRejectionCommentsDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  mobileVerified?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  tier0?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  tier1?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  tier2?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  tier3?: StrigaKycTierDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  tinCollected?: boolean;

  @ApiPropertyOptional({ example: 'TIN_INFORMATION_MISSING_DAC8' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'USER_ACCOUNT_ACTION_NEEDED' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class StrigaUserKycStatusResponseDto extends StrigaBaseResponseDto<StrigaUserKycStatusDto> {
  @ApiPropertyOptional({
    type: () => StrigaUserKycStatusDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycStatusDto)
  data!: StrigaUserKycStatusDto | null;
}

export class StrigaCardAddressResponseDto {
  @ApiPropertyOptional({ example: '53338 Aurelie Mount' })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiPropertyOptional({ example: '59880 Coy Club' })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional({ example: '11030' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Medhurstfort' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'EE' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'DHLExpress' })
  @IsOptional()
  @IsString()
  dispatchMethod?: string;
}

export class StrigaCardSecurityResponseDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  contactlessEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  withdrawalEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  internetPurchaseEnabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  overallLimitsEnabled?: boolean;
}

export class StrigaCardFeeValueResponseDto {
  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class StrigaCardFeeResponseDto {
  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  ourFee?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  theirFee?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  feeCurrency?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ type: () => StrigaCardFeeValueResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardFeeValueResponseDto)
  cardCreationFee?: StrigaCardFeeValueResponseDto;

  @ApiPropertyOptional({ type: () => StrigaCardFeeValueResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardFeeValueResponseDto)
  cardDeliveryFee?: StrigaCardFeeValueResponseDto;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  exchangeRate?: string;
}

export class StrigaCardLimitsResponseDto extends StrigaCardLimitsRequestDto {
  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 350 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dailyWithdrawalUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  monthlyWithdrawalUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyPurchaseAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyPurchaseUsed?: number;

  @ApiPropertyOptional({ example: 3000 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weeklyWithdrawalUsed?: number;
}

export class StrigaCreateCardResponseDto {
  @ApiPropertyOptional({ example: 'CARD 1' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '1d7377f8-eb20-42d5-9979-feb7ab9498bf' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'VIRTUAL' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'c1d2340e-89ef-4385-9104-e24363058ad6' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '**** **** **** 1234' })
  @IsOptional()
  @IsString()
  maskedCardNumber?: string;

  @ApiPropertyOptional({ example: '10/29' })
  @IsOptional()
  @IsString()
  expiryData?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ type: () => StrigaCardAddressResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardAddressResponseDto)
  address?: StrigaCardAddressResponseDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEnrolledFor3dSecure?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCard3dSecureActivated?: boolean;

  @ApiPropertyOptional({ type: () => StrigaCardSecurityResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardSecurityResponseDto)
  security?: StrigaCardSecurityResponseDto;

  @ApiPropertyOptional({ example: '2025-03-13T10:45:00.124Z' })
  @IsOptional()
  @IsString()
  activatedAt?: string;

  @ApiPropertyOptional({ example: '9ac77e120ef8c9dcd92abedbfe994bc5' })
  @IsOptional()
  @IsString()
  linkedAccountId?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  linkedAccountCurrency?: string;

  @ApiPropertyOptional({ example: '4ea59c14765e3816f91909fe2299ea38' })
  @IsOptional()
  @IsString()
  lastLinkedAccountId?: string;

  @ApiPropertyOptional({ example: 'e3c9e087-2a31-403d-a438-47bde03b95d2' })
  @IsOptional()
  @IsString()
  parentWalletId?: string;

  @ApiPropertyOptional({ example: '2025-03-13T10:45:00.124Z' })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiPropertyOptional({ type: () => StrigaCardFeeResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardFeeResponseDto)
  fee?: StrigaCardFeeResponseDto;

  @ApiPropertyOptional({ type: () => StrigaCardLimitsResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardLimitsResponseDto)
  limits?: StrigaCardLimitsResponseDto;

  @ApiPropertyOptional({ example: 'BLOCKEDBYCLIENT' })
  @IsOptional()
  @IsString()
  blockType?: string;
}

export class StrigaLinkCardAccountResponseDto {
  @ApiPropertyOptional({ example: '481f53afd5e311c1b4fb72a6046a5a9b' })
  @IsOptional()
  @IsString()
  linkedAccountId?: string;

  @ApiPropertyOptional({ example: '355c429d-272c-4e4c-a863-2c6f45d28ca9' })
  @IsOptional()
  @IsString()
  parentWalletId?: string;
}

export class StrigaCardStatementOrderAmountDto {
  @ApiPropertyOptional({ example: 'BTC' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: '0.00030718' })
  @IsOptional()
  @IsString()
  amountFloat?: string;

  @ApiPropertyOptional({ example: '30718' })
  @IsOptional()
  @IsString()
  amount?: string;
}

export class StrigaCardStatementOrderDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ type: () => StrigaCardStatementOrderAmountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardStatementOrderAmountDto)
  debit?: StrigaCardStatementOrderAmountDto;

  @ApiPropertyOptional({ type: () => StrigaCardStatementOrderAmountDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardStatementOrderAmountDto)
  credit?: StrigaCardStatementOrderAmountDto;
}

export class StrigaCardStatementTransactionDto {
  @ApiPropertyOptional({ example: 'f334b23d-a35d-4a7e-a47e-440fafc1924f' })
  @IsOptional()
  @IsString()
  relatedCardTransactionId?: string;

  @ApiPropertyOptional({ example: 'CARD_AUTHORIZATION' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @Type(() => Number)
  originalAmount?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  originalCurrency?: string;

  @ApiPropertyOptional({ example: 10.5 })
  @IsOptional()
  @Type(() => Number)
  transactionAmount?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  transactionCurrency?: string;

  @ApiPropertyOptional({ example: 'Striga Simulator' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ example: 'Striga Simulator' })
  @IsOptional()
  @IsString()
  merchantName?: string;

  @ApiPropertyOptional({ example: 'Tallinn' })
  @IsOptional()
  @IsString()
  merchantCity?: string;

  @ApiPropertyOptional({ example: 'EST' })
  @IsOptional()
  @IsString()
  merchantCountryCode?: string;

  @ApiPropertyOptional({ example: '5812' })
  @IsOptional()
  @IsString()
  merchantCategoryCode?: string;

  @ApiPropertyOptional({ example: 'f334b23d-a35d-4a7e-a47e-440fafc1924f' })
  @IsOptional()
  @IsString()
  accountTransactionId?: string;

  @ApiPropertyOptional({ type: () => StrigaCardStatementOrderDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardStatementOrderDto)
  order?: StrigaCardStatementOrderDto;

  @ApiPropertyOptional({ example: 'd8a8c7c7ceeec2c221971febd00d5685' })
  @IsOptional()
  @IsString()
  linkedAccountId?: string;

  @ApiPropertyOptional({ example: 'BTC' })
  @IsOptional()
  @IsString()
  linkedAccountCurrency?: string;

  @ApiPropertyOptional({ example: '0cb9da83-1252-4add-9290-e9458baf2892' })
  @IsOptional()
  @IsString()
  parentWalletId?: string;

  @ApiPropertyOptional({ example: '2023-11-09T11:38:50.877Z' })
  @IsOptional()
  @IsString()
  createdAt?: string;

  @ApiPropertyOptional({ example: '10.5' })
  @IsOptional()
  @IsString()
  merchantTransactionAmount?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  merchantTransactionCurrency?: string;

  @ApiPropertyOptional({ example: '10.5' })
  @IsOptional()
  @IsString()
  accountTransactionAmount?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  accountTransactionCurrency?: string;
}

export class StrigaCardStatementResponseDto {
  @ApiPropertyOptional({ type: () => [StrigaCardStatementTransactionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrigaCardStatementTransactionDto)
  transactions?: StrigaCardStatementTransactionDto[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  count?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  total?: number;
}

export class StrigaCardsByUserResponseDto {
  @ApiPropertyOptional({ type: () => [StrigaCreateCardResponseDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StrigaCreateCardResponseDto)
  cards?: StrigaCreateCardResponseDto[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  count?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  total?: number;
}
