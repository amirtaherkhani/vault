import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsIn, IsString, IsUUID, Length } from 'class-validator';

@Exclude()
export class StrigaEmailVerificationCodeDto {
  @ApiProperty({
    example: '123456',
    description: 'Email verification code',
  })
  @IsString()
  @Length(6, 6)
  @Expose()
  verificationId!: string;
}

@Exclude()
export class StrigaVerifyEmailForMeDto extends StrigaEmailVerificationCodeDto {}

@Exclude()
export class StrigaUserIdDto {
  @ApiProperty({
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
    description: 'Striga provider user Id',
    format: 'uuid',
  })
  @IsString()
  @IsUUID('4')
  @Expose()
  externalId!: string;
}

@Exclude()
export class StrigaVerifyEmailForAdminDto extends StrigaUserIdDto {
  @ApiProperty({
    example: '123456',
    description: 'Email verification code',
  })
  @IsString()
  @Length(6, 6)
  @Expose()
  verificationId!: string;
}

@Exclude()
export class StrigaResendEmailForAdminDto extends StrigaUserIdDto {}

@Exclude()
export class StrigaVerifyMobileForMeDto {
  @ApiProperty({
    example: '123456',
    description: 'Mobile verification code',
  })
  @IsString()
  @Length(6, 6)
  @Expose()
  verificationCode!: string;
}

@Exclude()
export class StrigaVerificationAcceptedDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  accepted!: boolean;
}

@Exclude()
export class StrigaVerificationActionDto {
  @ApiProperty({
    example: 'email',
    enum: ['email', 'mobile'],
  })
  @IsString()
  @IsIn(['email', 'mobile'])
  @Expose()
  channel!: 'email' | 'mobile';

  @ApiProperty({
    example: 'verify',
    enum: ['verify', 'resend'],
  })
  @IsString()
  @IsIn(['verify', 'resend'])
  @Expose()
  action!: 'verify' | 'resend';

  @ApiProperty({ example: true })
  @IsBoolean()
  @Expose()
  accepted!: boolean;
}
