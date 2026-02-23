import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { RoleEnum } from '../../../roles/roles.enum';
import { RoleGroups } from '../../../utils/transformers/enum.transformer';
import {
  StrigaAddressDto,
  StrigaDateOfBirthDto,
  StrigaMobileDto,
} from './striga-base.request.dto';

const STRIGA_RESPONSE_ROLES = [RoleEnum.admin, RoleEnum.user] as const;

@Exclude()
export class StrigaBaseResponseDto<T = unknown> {
  @ApiProperty({ example: 200 })
  @IsInt()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  success!: boolean;

  @ApiProperty({ example: 'success' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  message!: string;

  @ApiProperty({ example: null, nullable: true, type: Object })
  @IsOptional()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  error!: unknown | null;

  @ApiProperty({
    type: Object,
    example: { result: 'pong' },
    nullable: true,
    description: 'Provider payload',
  })
  @IsOptional()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  data!: Record<string, unknown> | T | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  hasNextPage!: boolean;
}

@Exclude()
export class StrigaPingResponseDto {
  @ApiProperty({ example: 'pong' })
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  result!: string;
}

@Exclude()
export class StrigaProviderPayloadResponseDto {
  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  payload!: Record<string, unknown> | null;
}

@Exclude()
export class StrigaUserKycTierSummaryResponseDto {
  @ApiPropertyOptional({ example: 'APPROVED' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  status?: string;
}

@Exclude()
export class StrigaUserKycSummaryResponseDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  mobileVerified?: boolean;

  @ApiPropertyOptional({ example: 'NOT_STARTED' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  status?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  tier0?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  tier1?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  tier2?: StrigaUserKycTierSummaryResponseDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycTierSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycTierSummaryResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  tier3?: StrigaUserKycTierSummaryResponseDto;
}

@Exclude()
export class StrigaVerificationInfoResponseDto {
  @ApiPropertyOptional({
    example: '2024-01-25T04:56:39.745Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  dateExpires?: string;
}

@Exclude()
export class StrigaCloudUserResponseDto {
  @ApiProperty()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  lastName!: string;

  @ApiProperty()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  email!: string;

  @ApiPropertyOptional({ type: () => StrigaMobileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaMobileDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  mobile?: StrigaMobileDto;

  @ApiPropertyOptional({ type: () => StrigaDateOfBirthDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaDateOfBirthDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  dateOfBirth?: StrigaDateOfBirthDto;

  @ApiPropertyOptional({ type: () => StrigaAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaAddressDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  address?: StrigaAddressDto;

  @ApiPropertyOptional({ type: () => StrigaUserKycSummaryResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaUserKycSummaryResponseDto)
  @Expose({
    ...RoleGroups([...STRIGA_RESPONSE_ROLES]),
    name: 'KYC',
  })
  kyc?: StrigaUserKycSummaryResponseDto;

  @ApiProperty()
  @IsString()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  userId!: string;

  @ApiPropertyOptional({ example: 1706158299688 })
  @IsOptional()
  @IsInt()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  createdAt?: number;

  @ApiPropertyOptional({ type: () => StrigaVerificationInfoResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaVerificationInfoResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  emailVerification?: StrigaVerificationInfoResponseDto;

  @ApiPropertyOptional({ type: () => StrigaVerificationInfoResponseDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaVerificationInfoResponseDto)
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  mobileVerification?: StrigaVerificationInfoResponseDto;

  @ApiPropertyOptional({ type: () => [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  missingFields?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([...STRIGA_RESPONSE_ROLES]))
  tinCollected?: boolean;
}

@Exclude()
export class StrigaKycLimitSplitDto {
  @ApiProperty({ example: '0' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  all!: string;

  @ApiProperty({ example: '0' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  va!: string;
}

@Exclude()
export class StrigaKycRejectionCommentsDto {
  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  autoComment?: string;

  @ApiPropertyOptional({
    example: 'We could not verify your profile. Your region is not supported.',
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  userComment?: string;

  @ApiPropertyOptional({ example: 'Incorrect company name.' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  clientComment?: string;

  @ApiPropertyOptional({
    example:
      'According to the provided documents, the data in the profile is incorrect.',
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  moderationComment?: string;
}

@Exclude()
export class StrigaKycTierDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  eligible!: boolean;

  @ApiProperty({ example: 'NOT_STARTED' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status!: string;

  @ApiPropertyOptional({ example: '0' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  outboundLimitConsumed?: string;

  @ApiPropertyOptional({ example: '1500000' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  outboundLimitAllowed?: string;

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  inboundLimitConsumed?: StrigaKycLimitSplitDto;

  @ApiPropertyOptional({ type: () => StrigaKycLimitSplitDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycLimitSplitDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  inboundLimitAllowed?: StrigaKycLimitSplitDto;

  @ApiPropertyOptional({
    example: '2024-02-09T10:14:53.996Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  verificationExpiryDate?: string;
}

@Exclude()
export class StrigaUserKycStatusDto {
  @ApiProperty({ example: '20ee2b7f-fd9b-4cc1-8dfe-695be722dd45' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  userId!: string;

  @ApiProperty({ example: 'REJECTED_FINAL' })
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status!: string;

  @ApiPropertyOptional({
    type: () => [String],
    example: ['WRONG_USER_REGION', 'REGULATIONS_VIOLATIONS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  details?: string[];

  @ApiPropertyOptional({ type: () => StrigaKycRejectionCommentsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycRejectionCommentsDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  rejectionComments?: StrigaKycRejectionCommentsDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  mobileVerified?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  currentTier?: number;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier0?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier1?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier2?: StrigaKycTierDto;

  @ApiPropertyOptional({ type: () => StrigaKycTierDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaKycTierDto)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier3?: StrigaKycTierDto;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tinCollected?: boolean;

  @ApiPropertyOptional({ example: 'TIN_INFORMATION_MISSING_DAC8' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  reason?: string;

  @ApiPropertyOptional({ example: 'USER_ACCOUNT_ACTION_NEEDED' })
  @IsOptional()
  @IsString()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
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
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  data!: StrigaUserKycStatusDto | null;
}
