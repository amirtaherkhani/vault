import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { RoleEnum } from '../../../../roles/roles.enum';
import { RoleGroups } from '../../../../utils/transformers/enum.transformer';

@Exclude()
export class StrigaUserMobile {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  countryCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  number!: string;
}

@Exclude()
export class StrigaUserAddress {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  addressLine1!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  addressLine2?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  city!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  state?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  country!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  postalCode!: string;
}

@Exclude()
export class StrigaUserKycTier {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status?: string;
}

@Exclude()
export class StrigaUserKyc {
  @ApiProperty({
    type: () => Boolean,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  emailVerified?: boolean | null;

  @ApiProperty({
    type: () => Boolean,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  mobileVerified?: boolean | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  status?: string | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  @Type(() => StrigaUserKycTier)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier0?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  @Type(() => StrigaUserKycTier)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier1?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  @Type(() => StrigaUserKycTier)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier2?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  @Type(() => StrigaUserKycTier)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  tier3?: StrigaUserKycTier | null;
}

@Exclude()
export class StrigaUser {
  @ApiProperty({
    type: () => String,
    format: 'uuid',
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  externalId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  email: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  lastName!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  firstName!: string;

  @ApiProperty({
    type: () => StrigaUserMobile,
    nullable: false,
  })
  @Type(() => StrigaUserMobile)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  mobile!: StrigaUserMobile;

  @ApiProperty({
    type: () => StrigaUserAddress,
    nullable: false,
  })
  @Type(() => StrigaUserAddress)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  address!: StrigaUserAddress;

  @ApiProperty({
    type: () => StrigaUserKyc,
    nullable: true,
  })
  @Type(() => StrigaUserKyc)
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  kyc?: StrigaUserKyc | null;

  @ApiProperty({
    type: String,
  })
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  id!: string;

  @ApiProperty()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  createdAt!: Date;

  @ApiProperty()
  @Expose(RoleGroups([RoleEnum.admin, RoleEnum.user]))
  updatedAt!: Date;
}
