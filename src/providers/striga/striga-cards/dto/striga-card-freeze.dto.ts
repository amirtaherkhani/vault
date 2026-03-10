import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsString, Min } from 'class-validator';
import { StrigaCardBlockType, StrigaCardStatus } from '../domain/striga-card';

export class StrigaToggleCardFreezeForMeDto {
  @ApiProperty({ example: 'd46a83e4-c59e-44df-a7cc-e29b7f3a6ee1' })
  @IsString()
  cardId!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  freeze!: boolean;
}

export class StrigaToggleCardFreezeForAdminDto {
  @ApiProperty({ example: 'd46a83e4-c59e-44df-a7cc-e29b7f3a6ee1' })
  @IsString()
  cardId!: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  freeze!: boolean;

  @ApiProperty({ example: 9, description: 'App user id' })
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaCardFreezeStatusDto {
  @ApiProperty({ example: 'ACTIVE', nullable: true })
  previousStatus!: StrigaCardStatus | null;

  @ApiProperty({ example: 'BLOCKED', nullable: true })
  updatedStatus!: StrigaCardStatus | null;

  @ApiProperty({ example: 'd46a83e4-c59e-44df-a7cc-e29b7f3a6ee1' })
  cardId!: string;

  @ApiProperty({ example: 'BLOCKEDBYCLIENT', nullable: true })
  blockType!: StrigaCardBlockType | null;
}

export class StrigaCardFreezeStateDto {
  @ApiProperty({ example: true })
  frozen!: boolean;

  @ApiProperty({ example: 'BLOCKED', nullable: true })
  status!: StrigaCardStatus | null;

  @ApiProperty({ example: 'BLOCKEDBYCLIENT', nullable: true })
  blockType!: StrigaCardBlockType | null;
}
