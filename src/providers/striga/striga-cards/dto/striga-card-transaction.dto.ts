import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
  StrigaSupportedCardAssetName,
} from '../../types/striga-const.type';
import { StrigaGetCardStatementRequestDto } from '../../dto/striga-base.request.dto';

class StrigaStatementPaginationDto {
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

export class StrigaAccountStatementByIdForMeDto extends StrigaStatementPaginationDto {
  @ApiProperty({ example: '244337fcf5b13ff40f7780bdd3e66d30' })
  @IsString()
  accountId!: string;
}

export class StrigaAccountStatementByIdForAdminDto extends StrigaAccountStatementByIdForMeDto {
  @ApiProperty({ example: 9, description: 'App user id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaAccountStatementByAssetForMeDto extends StrigaStatementPaginationDto {
  @ApiProperty({ enum: STRIGA_SUPPORTED_CARD_ASSET_NAMES })
  @IsString()
  currency!: StrigaSupportedCardAssetName;
}

export class StrigaAccountStatementByAssetForAdminDto extends StrigaAccountStatementByAssetForMeDto {
  @ApiProperty({ example: 9, description: 'App user id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaCardStatementForMeDto extends StrigaGetCardStatementRequestDto {}

export class StrigaCardStatementForAdminDto extends StrigaGetCardStatementRequestDto {
  @ApiProperty({ example: 9, description: 'App user id' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;
}
