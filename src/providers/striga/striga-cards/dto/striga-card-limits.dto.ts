import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min, ValidateNested } from 'class-validator';
import { StrigaCardBlockType, StrigaCardLimits, StrigaCardStatus } from '../domain/striga-card';
import { StrigaCardLimitsRequestDto } from '../../dto/striga-base.request.dto';

export class StrigaUpdateCardLimitsForMeDto {
  @ApiProperty({ example: 'd33c677a-8a2b-41ca-8109-d4572df1fd97' })
  @IsUUID()
  cardId!: string;

  @ApiProperty({ type: () => StrigaCardLimitsRequestDto })
  @ValidateNested()
  @Type(() => StrigaCardLimitsRequestDto)
  limits!: StrigaCardLimitsRequestDto;
}

export class StrigaUpdateCardLimitsForAdminDto extends StrigaUpdateCardLimitsForMeDto {
  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaUpdateCardLimitsResultDto {
  @ApiProperty({ example: true })
  updated!: boolean;

  @ApiProperty({ example: 'd33c677a-8a2b-41ca-8109-d4572df1fd97' })
  cardId!: string;

  @ApiPropertyOptional({ type: () => StrigaCardLimits })
  @IsOptional()
  limits?: StrigaCardLimits | null;

  @ApiPropertyOptional({ enum: StrigaCardStatus, nullable: true })
  @IsOptional()
  status?: StrigaCardStatus | null;

  @ApiPropertyOptional({ enum: StrigaCardBlockType, nullable: true })
  @IsOptional()
  blockType?: StrigaCardBlockType | null;
}

export class StrigaResetCardLimitsBaseDto {
  @ApiProperty({ example: 'd33c677a-8a2b-41ca-8109-d4572df1fd97' })
  @IsUUID()
  cardId!: string;
}

export class StrigaResetCardLimitsForMeDto extends StrigaResetCardLimitsBaseDto {}

export class StrigaResetCardLimitsForAdminDto extends StrigaResetCardLimitsBaseDto {
  @ApiProperty({ example: 9 })
  @IsInt()
  @Min(1)
  userId!: number;
}
