import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsIn, IsInt, IsString, IsUUID } from 'class-validator';

@Exclude()
export class StrigaStartKycTierDto {
  @ApiProperty({
    example: 1,
    enum: [1, 2],
    description: 'KYC tier to start',
  })
  @Type(() => Number)
  @IsInt()
  @IsIn([1, 2])
  @Expose()
  tier!: 1 | 2;
}

@Exclude()
export class StrigaStartKycForMeDto extends StrigaStartKycTierDto {}

@Exclude()
export class StrigaStartKycForAdminDto extends StrigaStartKycTierDto {
  @ApiProperty({
    example: '2f1853b2-927a-4aa9-8bb1-3e51fb119ace',
    description: 'Striga user ID',
    format: 'uuid',
  })
  @IsString()
  @IsUUID('4')
  @Expose()
  userId!: string;
}

@Exclude()
export class StrigaStartKycProviderRequestDto extends StrigaStartKycTierDto {
  @ApiProperty({
    example: '2f1853b2-927a-4aa9-8bb1-3e51fb119ace',
    description: 'Unique Striga user ID',
    format: 'uuid',
  })
  @IsString()
  @IsUUID('4')
  @Expose()
  userId!: string;
}

@Exclude()
export class StrigaStartKycResponseDto {
  @ApiProperty({ example: 'SUMSUB' })
  @IsString()
  @Expose()
  provider!: string;

  @ApiProperty({ example: '_act-sbx-cc6a85f3-4315-4d26-b507-3e5ea31ff2f9' })
  @IsString()
  @Expose()
  token!: string;

  @ApiProperty({
    example: '2f1853b2-927a-4aa9-8bb1-3e51fb119ace',
    format: 'uuid',
  })
  @IsString()
  @Expose()
  userId!: string;

  @ApiProperty({
    example: 'https://in.sumsub.com/idensic/l/#/sbx_Eke06K3fpzlbWuf3',
  })
  @IsString()
  @Expose()
  verificationLink!: string;
}
