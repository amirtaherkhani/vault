import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';

@Exclude()
export class StrigaKycTotalStatusDto {
  @ApiProperty({
    example: false,
    description:
      'True only when email/mobile are verified and status + tier0..tier3 are APPROVED.',
  })
  @IsBoolean()
  @Expose()
  approved!: boolean;
}
