import { StrigaUser } from '../../striga-users/domain/striga-user';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum StrigaCardType {
  VIRTUAL = 'VIRTUAL',
  PHYSICAL = 'PHYSICAL',
}

export class StrigaCardSecurity {
  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  contactlessEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  withdrawalEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  internetPurchaseEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  overallLimitsEnabled!: boolean;
}

export class StrigaCardLimits {
  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  transactionPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  transactionWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  transactionInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  transactionContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  dailyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  monthlyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  weeklyWithdrawalUsed?: number;
}

export class StrigaCard {
  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
    description: 'Provider card ID in Striga cloud',
  })
  externalId?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  status?: string | null;

  @ApiProperty({
    type: () => String,
    enum: StrigaCardType,
    nullable: false,
    default: StrigaCardType.VIRTUAL,
  })
  type!: StrigaCardType;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  maskedCardNumber?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  expiryData?: string | null;

  @ApiPropertyOptional({
    type: () => Boolean,
    nullable: true,
  })
  isEnrolledFor3dSecure?: boolean | null;

  @ApiPropertyOptional({
    type: () => Boolean,
    nullable: true,
  })
  isCard3dSecureActivated?: boolean | null;

  @ApiPropertyOptional({
    type: () => StrigaCardSecurity,
    nullable: true,
  })
  @Type(() => StrigaCardSecurity)
  security?: StrigaCardSecurity | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  linkedAccountId?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  parentWalletId?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  linkedAccountCurrency?: string | null;

  @ApiPropertyOptional({
    type: () => StrigaCardLimits,
    nullable: true,
  })
  @Type(() => StrigaCardLimits)
  limits?: StrigaCardLimits | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  blockType?: string | null;

  @ApiProperty({
    type: () => StrigaUser,
    nullable: false,
  })
  user!: StrigaUser;

  @ApiProperty({
    type: String,
  })
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
