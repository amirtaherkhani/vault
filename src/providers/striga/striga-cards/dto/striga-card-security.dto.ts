import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  StrigaCardBlockType,
  StrigaCardSecurity,
  StrigaCardStatus,
} from '../domain/striga-card';
import { StrigaCardSecuritySettingsRequestDto } from '../../dto/striga-base.request.dto';
import { StrigaCardSecurityDto } from './create-striga-card.dto';

export class StrigaUpdateCardSecurityForMeDto {
  @ApiProperty({ example: 'd33c677a-8a2b-41ca-8109-d4572df1fd97' })
  @IsUUID()
  cardId!: string;

  @ApiProperty({ type: () => StrigaCardSecuritySettingsRequestDto })
  @ValidateNested()
  @Type(() => StrigaCardSecuritySettingsRequestDto)
  security!: StrigaCardSecuritySettingsRequestDto;
}

export class StrigaUpdateCardSecurityForAdminDto extends StrigaUpdateCardSecurityForMeDto {
  @ApiProperty({ example: 9, description: 'Application user id' })
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaUpdateCardSecurityResultDto {
  @ApiProperty({ example: true })
  updated!: boolean;

  @ApiProperty({ example: 'd33c677a-8a2b-41ca-8109-d4572df1fd97' })
  @IsString()
  @IsNotEmpty()
  cardId!: string;

  @ApiPropertyOptional({ type: () => StrigaCardSecurityDto })
  @IsOptional()
  security?: StrigaCardSecurity | null;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: StrigaCardStatus,
    nullable: true,
  })
  @IsOptional()
  status?: StrigaCardStatus | null;

  @ApiPropertyOptional({
    example: 'BLOCKEDBYCLIENT',
    enum: StrigaCardBlockType,
    nullable: true,
  })
  @IsOptional()
  blockType?: StrigaCardBlockType | null;
}
