import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StrigaCardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
