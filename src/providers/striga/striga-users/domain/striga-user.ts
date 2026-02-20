import { ApiProperty } from '@nestjs/swagger';

export class StrigaUserMobile {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  countryCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  number!: string;
}

export class StrigaUserAddress {
  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  addressLine1!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  addressLine2?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  city!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  state?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  country!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  postalCode!: string;
}

export class StrigaUserKycTier {
  @ApiProperty({
    type: () => Boolean,
    nullable: true,
  })
  eligible?: boolean;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  status?: string;
}

export class StrigaUserKycRejectionComments {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  userComment?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  autoComment?: string | null;
}

export class StrigaUserKyc {
  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  status?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  currentTier?: number | null;

  @ApiProperty({
    type: () => [String],
    nullable: true,
  })
  details?: string[] | null;

  @ApiProperty({
    type: () => Boolean,
    nullable: true,
  })
  rejectionFinal?: boolean | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  reason?: string | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  type?: string | null;

  @ApiProperty({
    type: () => Number,
    nullable: true,
  })
  ts?: number | null;

  @ApiProperty({
    type: () => Boolean,
    nullable: true,
  })
  tinCollected?: boolean | null;

  @ApiProperty({
    type: () => String,
    nullable: true,
  })
  tinVerificationExpiryDate?: string | null;

  @ApiProperty({
    type: () => StrigaUserKycRejectionComments,
    nullable: true,
  })
  rejectionComments?: StrigaUserKycRejectionComments | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  tier0?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  tier1?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  tier2?: StrigaUserKycTier | null;

  @ApiProperty({
    type: () => StrigaUserKycTier,
    nullable: true,
  })
  tier3?: StrigaUserKycTier | null;
}

export class StrigaUser {
  @ApiProperty({
    type: () => String,
    format: 'uuid',
    nullable: false,
  })
  externalId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  email: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  lastName!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
  })
  firstName!: string;

  @ApiProperty({
    type: () => StrigaUserMobile,
    nullable: false,
  })
  mobile!: StrigaUserMobile;

  @ApiProperty({
    type: () => StrigaUserAddress,
    nullable: false,
  })
  address!: StrigaUserAddress;

  @ApiProperty({
    type: () => StrigaUserKyc,
    nullable: true,
  })
  kyc?: StrigaUserKyc | null;

  @ApiProperty({
    type: String,
  })
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
