import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { StrigaSetCardPinRequestDto } from '../../dto/striga-base.request.dto';

export class StrigaSetCardPinForMeDto extends StrigaSetCardPinRequestDto {}

export class StrigaSetCardPinForAdminDto extends StrigaSetCardPinRequestDto {
  @ApiProperty({ example: 9, description: 'App user id' })
  @IsInt()
  @Min(1)
  userId!: number;
}

export class StrigaCardPinResultDto {
  @ApiProperty({ example: true })
  updated!: boolean;
}
