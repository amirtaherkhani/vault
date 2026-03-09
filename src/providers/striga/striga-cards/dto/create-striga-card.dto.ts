import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmptyObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { StrigaCardType } from '../domain/striga-card';
import { StrigaUserDto } from '../../striga-users/dto/striga-user.dto';
import {
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
  StrigaSupportedCardAssetName,
} from '../../types/striga-const.type';

@Exclude()
export class StrigaCardSecurityDto {
  @ApiProperty({
    example: true,
    description: 'Enable/disable contactless payments',
  })
  @IsBoolean()
  @Expose()
  contactlessEnabled!: boolean;

  @ApiProperty({
    example: true,
    description: 'Enable/disable ATM withdrawals',
  })
  @IsBoolean()
  @Expose()
  withdrawalEnabled!: boolean;

  @ApiProperty({
    example: true,
    description: 'Enable/disable internet purchases',
  })
  @IsBoolean()
  @Expose()
  internetPurchaseEnabled!: boolean;

  @ApiProperty({
    example: true,
    description: 'Enable/disable overall card limits',
  })
  @IsBoolean()
  @Expose()
  overallLimitsEnabled!: boolean;
}

@Exclude()
export class StrigaCardLimitsDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyWithdrawal?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyInternetPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyWithdrawal?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyInternetPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyWithdrawal?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyInternetPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  transactionPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  transactionWithdrawal?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  transactionInternetPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  transactionContactlessPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyOverallPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyOverallPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyOverallPurchase?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  dailyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  monthlyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Expose()
  weeklyWithdrawalUsed?: number;
}

@Exclude()
export class CreateStrigaCardDto {
  @ApiPropertyOptional({
    example: '1d7377f8-eb20-42d5-9979-feb7ab9498bf',
    description: 'Provider card ID in Striga cloud',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  externalId?: string | null;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Card status snapshot',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string | null;

  @ApiPropertyOptional({
    enum: StrigaCardType,
    default: StrigaCardType.VIRTUAL,
    description: 'Card type. Defaults to VIRTUAL.',
  })
  @IsOptional()
  @IsEnum(StrigaCardType)
  @Expose()
  type?: StrigaCardType;

  @ApiPropertyOptional({
    example: '474367******2236',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  maskedCardNumber?: string | null;

  @ApiPropertyOptional({
    example: '2027-01-31T23:59:59Z',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  expiryData?: string | null;

  @ApiPropertyOptional({
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  isEnrolledFor3dSecure?: boolean | null;

  @ApiPropertyOptional({
    example: true,
    nullable: true,
  })
  @IsOptional()
  @IsBoolean()
  @Expose()
  isCard3dSecureActivated?: boolean | null;

  @ApiPropertyOptional({
    type: () => StrigaCardSecurityDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardSecurityDto)
  @IsNotEmptyObject()
  @Expose()
  security?: StrigaCardSecurityDto | null;

  @ApiPropertyOptional({
    example: '22eb9caee08de8410eb0b41c5afd249e',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  linkedAccountId?: string | null;

  @ApiPropertyOptional({
    example: 'a82afcee-6b53-4869-a41a-df34e6b228db',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  parentWalletId?: string | null;

  @ApiPropertyOptional({
    example: 'EUR',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @IsIn(STRIGA_SUPPORTED_CARD_ASSET_NAMES)
  @Expose()
  linkedAccountCurrency?: StrigaSupportedCardAssetName | null;

  @ApiPropertyOptional({
    type: () => StrigaCardLimitsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardLimitsDto)
  @IsNotEmptyObject()
  @Expose()
  limits?: StrigaCardLimitsDto | null;

  @ApiPropertyOptional({
    example: 'BLOCKEDBYCLIENT',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  blockType?: string | null;

  @ApiProperty({
    required: true,
    type: () => StrigaUserDto,
  })
  @ValidateNested()
  @Type(() => StrigaUserDto)
  @IsNotEmptyObject()
  @Expose()
  user!: StrigaUserDto;
}
