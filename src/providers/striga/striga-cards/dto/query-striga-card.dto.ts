import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import {
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
  StrigaSupportedCardAssetName,
} from '../../types/striga-const.type';

@Exclude()
export class FilterStrigaCardsDto {
  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  @Expose()
  status?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  @Expose()
  linkedAccountCurrency?: string;

  @ApiPropertyOptional({
    example: 'e3c9e087-2a31-403d-a438-47bde03b95d2',
    description: 'Parent wallet (Striga walletId)',
  })
  @IsOptional()
  @IsString()
  @Expose()
  parentWalletId?: string;
}

@Exclude()
export class StrigaCardIdParamDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Local Striga card record ID',
  })
  @IsUUID()
  @Expose()
  id!: string;
}

@Exclude()
export class StrigaCardCurrencyParamDto {
  @ApiPropertyOptional({
    enum: STRIGA_SUPPORTED_CARD_ASSET_NAMES,
    description: 'Linked account currency',
  })
  @IsString()
  @IsIn(STRIGA_SUPPORTED_CARD_ASSET_NAMES)
  @Expose()
  currency!: StrigaSupportedCardAssetName;
}
