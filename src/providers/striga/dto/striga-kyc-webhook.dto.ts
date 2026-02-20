import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

@Exclude()
export class StrigaKycWebhookLimitSplitDto {
  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  @Expose()
  all?: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  @Expose()
  va?: string;
}

@Exclude()
export class StrigaKycWebhookRejectionCommentsDto {
  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose()
  userComment?: string;

  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose()
  autoComment?: string;

  @ApiPropertyOptional({ example: 'Incorrect company name.' })
  @IsOptional()
  @IsString()
  @Expose()
  clientComment?: string;

  @ApiPropertyOptional({
    example:
      'According to the provided documents, the data in the profile is incorrect.',
  })
  @IsOptional()
  @IsString()
  @Expose()
  moderationComment?: string;
}

@Exclude()
export class StrigaKycWebhookTierDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  eligible!: boolean;

  @ApiProperty({ example: 'NOT_STARTED' })
  @IsString()
  @Expose()
  status!: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  @Expose()
  outboundLimitConsumed?: string;

  @ApiPropertyOptional({ example: '1500000' })
  @IsOptional()
  @IsString()
  @Expose()
  outboundLimitAllowed?: string;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookLimitSplitDto)
  @Expose()
  inboundLimitConsumed?: StrigaKycWebhookLimitSplitDto;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookLimitSplitDto)
  @Expose()
  inboundLimitAllowed?: StrigaKycWebhookLimitSplitDto;

  @ApiPropertyOptional({
    example: '2024-02-09T10:14:53.996Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  @Expose()
  verificationExpiryDate?: string;
}

@Exclude()
export class StrigaKycWebhookDto {
  @ApiProperty({ example: '4a5e7ba5-cde2-480d-9549-26568100c150' })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({ example: 'REJECTED' })
  @IsString()
  @Expose()
  status!: string;

  @ApiPropertyOptional({
    type: () => [String],
    example: ['BAD_PROOF_OF_ADDRESS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  details?: string[];

  @ApiPropertyOptional({ type: () => StrigaKycWebhookRejectionCommentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookRejectionCommentsDto)
  @Expose()
  rejectionComments?: StrigaKycWebhookRejectionCommentsDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  rejectionFinal?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Expose()
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookTierDto)
  @Expose()
  tier0?: StrigaKycWebhookTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookTierDto)
  @Expose()
  tier1?: StrigaKycWebhookTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookTierDto)
  @Expose()
  tier2?: StrigaKycWebhookTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycWebhookTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycWebhookTierDto)
  @Expose()
  tier3?: StrigaKycWebhookTierDto;

  @ApiPropertyOptional({ example: 1732703202876 })
  @IsOptional()
  @IsInt()
  @Expose()
  ts?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  tinCollected?: boolean;

  @ApiPropertyOptional({ example: 'USER_ACCOUNT_ACTION_NEEDED' })
  @IsOptional()
  @IsString()
  @Expose()
  type?: string;

  @ApiPropertyOptional({ example: 'TIN_INFORMATION_MISSING_DAC8' })
  @IsOptional()
  @IsString()
  @Expose()
  reason?: string;

  @ApiPropertyOptional({
    example: '2026-03-01T19:12:48.811Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  @Expose()
  tinVerificationExpiryDate?: string;
}

@Exclude()
export class StrigaKycWebhookEventDto extends StrigaKycWebhookDto {
  @ApiPropertyOptional({ example: 'striga' })
  @IsOptional()
  @IsString()
  @Expose()
  provider?: string;

  @ApiPropertyOptional({ example: '/kyc' })
  @IsOptional()
  @IsString()
  @Expose()
  webhookPath?: string;

  @ApiPropertyOptional({ example: 'KYC_REJECTED' })
  @IsOptional()
  @IsString()
  @Expose()
  webhookType?: string;
}
