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
import { StrigaBaseResponseDto } from './striga-base.response.dto';

@Exclude()
export class StrigaKycLimitSplitDto {
  @ApiProperty({ example: '0' })
  @IsString()
  @Expose()
  all!: string;

  @ApiProperty({ example: '0' })
  @IsString()
  @Expose()
  va!: string;
}

@Exclude()
export class StrigaKycRejectionCommentsDto {
  @ApiPropertyOptional({
    example:
      'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose()
  autoComment?: string;

  @ApiPropertyOptional({
    example:
      'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose()
  userComment?: string;

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
export class StrigaKycTierDto {
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

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  @Expose()
  inboundLimitConsumed?: StrigaKycLimitSplitDto;

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  @Expose()
  inboundLimitAllowed?: StrigaKycLimitSplitDto;

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
export class StrigaUserKycStatusDto {
  @ApiProperty({ example: '20ee2b7f-fd9b-4cc1-8dfe-695be722dd45' })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({ example: 'REJECTED_FINAL' })
  @IsString()
  @Expose()
  status!: string;

  @ApiPropertyOptional({
    type: () => [String],
    example: ['WRONG_USER_REGION', 'REGULATIONS_VIOLATIONS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose()
  details?: string[];

  @ApiPropertyOptional({ type: () => StrigaKycRejectionCommentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycRejectionCommentsDto)
  @Expose()
  rejectionComments?: StrigaKycRejectionCommentsDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  mobileVerified?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Expose()
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose()
  tier0?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose()
  tier1?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose()
  tier2?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose()
  tier3?: StrigaKycTierDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose()
  tinCollected?: boolean;

  @ApiPropertyOptional({ example: 'TIN_INFORMATION_MISSING_DAC8' })
  @IsOptional()
  @IsString()
  @Expose()
  reason?: string;

  @ApiPropertyOptional({ example: 'USER_ACCOUNT_ACTION_NEEDED' })
  @IsOptional()
  @IsString()
  @Expose()
  type?: string;
}

@Exclude()
export class StrigaUserKycStatusResponseDto extends StrigaBaseResponseDto<StrigaUserKycStatusDto> {
  @ApiPropertyOptional({
    type: () => StrigaUserKycStatusDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycStatusDto)
  @Expose()
  data!: StrigaUserKycStatusDto | null;
}
