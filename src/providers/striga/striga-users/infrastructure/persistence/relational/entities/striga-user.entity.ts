import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import {
  StrigaUserAddress,
  StrigaUserKyc,
  StrigaUserMobile,
} from '../../../../domain/striga-user';
import { EntityRelationalHelper } from '../../../../../../../utils/relational-entity-helper';

@Entity({
  name: 'striga_user',
})
export class StrigaUserEntity extends EntityRelationalHelper {
  @Column({
    type: 'uuid',
    nullable: false,
    unique: true,
  })
  externalId!: string;

  @Column({
    nullable: false,
    type: String,
  })
  email!: string;

  @Column({
    nullable: false,
    type: String,
  })
  lastName!: string;

  @Column({
    nullable: false,
    type: String,
  })
  firstName!: string;

  @Column({
    type: 'jsonb',
    nullable: false,
  })
  mobile!: StrigaUserMobile;

  @Column({
    type: 'jsonb',
    nullable: false,
  })
  address!: StrigaUserAddress;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  kyc?: StrigaUserKyc | null;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
