import { StrigaUser } from '../../striga-users/domain/striga-user';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { RoleEnum } from '../../../../roles/roles.enum';
import { RoleGroups } from '../../../../utils/transformers/enum.transformer';
import { StrigaSupportedCardAssetName } from '../../types/striga-const.type';

export enum StrigaCardType {
  VIRTUAL = 'VIRTUAL',
  PHYSICAL = 'PHYSICAL',
}

@Exclude()
export class StrigaCardSecurity {
  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  contactlessEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  withdrawalEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  internetPurchaseEnabled!: boolean;

  @ApiProperty({
    type: () => Boolean,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  overallLimitsEnabled!: boolean;
}

@Exclude()
export class StrigaCardLimits {
  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  transactionPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  transactionWithdrawal?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  transactionInternetPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  transactionContactlessPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyOverallPurchase?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  dailyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  monthlyWithdrawalUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyContactlessPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyContactlessPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyInternetPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyInternetPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyOverallPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyOverallPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyPurchaseAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyPurchaseUsed?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyWithdrawalAvailable?: number;

  @ApiPropertyOptional({ type: () => Number, nullable: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  weeklyWithdrawalUsed?: number;
}

@Exclude()
export class StrigaCard {
  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
    description: 'Provider card Id in Striga cloud',
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  externalId?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status?: string | null;

  @ApiProperty({
    type: () => String,
    enum: StrigaCardType,
    nullable: false,
    default: StrigaCardType.VIRTUAL,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  type!: StrigaCardType;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  maskedCardNumber?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  expiryData?: string | null;

  @ApiPropertyOptional({
    type: () => Boolean,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  isEnrolledFor3dSecure?: boolean | null;

  @ApiPropertyOptional({
    type: () => Boolean,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  isCard3dSecureActivated?: boolean | null;

  @ApiPropertyOptional({
    type: () => StrigaCardSecurity,
    nullable: true,
  })
  @Type(() => StrigaCardSecurity)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  security?: StrigaCardSecurity | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  linkedAccountId?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  parentWalletId?: string | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  linkedAccountCurrency?: StrigaSupportedCardAssetName | null;

  @ApiPropertyOptional({
    type: () => StrigaCardLimits,
    nullable: true,
  })
  @Type(() => StrigaCardLimits)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  limits?: StrigaCardLimits | null;

  @ApiPropertyOptional({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  blockType?: string | null;

  @ApiProperty({
    type: () => StrigaUser,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  user!: StrigaUser;

  @ApiProperty({
    type: String,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  id!: string;

  @ApiProperty()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  createdAt!: Date;

  @ApiProperty()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  updatedAt!: Date;
}
