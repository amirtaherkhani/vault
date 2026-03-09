import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { StrigaCardType } from '../domain/striga-card';
import {
  StrigaCardLimitsDto,
  StrigaCardSecurityDto,
} from './create-striga-card.dto';
import { StrigaUserDto } from '../../striga-users/dto/striga-user.dto';
import {
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
  StrigaSupportedCardAssetName,
} from '../../types/striga-const.type';

@Exclude()
export class StrigaCardDto {
  @ApiProperty({
    format: 'uuid',
    example: '8fa4f6ef-9e76-4cb2-97cb-1401e24e58f5',
    description: 'Local Striga card record ID',
  })
  @IsUUID()
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    example: '1d7377f8-eb20-42d5-9979-feb7ab9498bf',
    nullable: true,
    description: 'Provider card ID in Striga cloud',
  })
  @IsOptional()
  @IsString()
  @Expose()
  externalId?: string | null;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string | null;

  @ApiProperty({
    enum: StrigaCardType,
    default: StrigaCardType.VIRTUAL,
  })
  @IsEnum(StrigaCardType)
  @Expose()
  type!: StrigaCardType;

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
  @Expose()
  isEnrolledFor3dSecure?: boolean | null;

  @ApiPropertyOptional({
    example: true,
    nullable: true,
  })
  @IsOptional()
  @Expose()
  isCard3dSecureActivated?: boolean | null;

  @ApiPropertyOptional({
    type: () => StrigaCardSecurityDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardSecurityDto)
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
  @Expose()
  @IsIn(STRIGA_SUPPORTED_CARD_ASSET_NAMES)
  linkedAccountCurrency?: StrigaSupportedCardAssetName | null;

  @ApiPropertyOptional({
    type: () => StrigaCardLimitsDto,
    nullable: true,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => StrigaCardLimitsDto)
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
    type: () => StrigaUserDto,
  })
  @ValidateNested()
  @Type(() => StrigaUserDto)
  @Expose()
  user!: StrigaUserDto;

  @ApiProperty({
    example: '2026-02-21T11:25:30.000Z',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: '2026-02-21T11:25:30.000Z',
    format: 'date-time',
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  @Expose()
  updatedAt!: Date;
}
