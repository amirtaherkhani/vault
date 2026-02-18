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
    type: String,
  })
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
