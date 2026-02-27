import { StrigaUserEntity } from '../../../../../striga-users/infrastructure/persistence/relational/entities/striga-user.entity';

import {
  StrigaCardLimits,
  StrigaCardSecurity,
  StrigaCardType,
} from '../../../../domain/striga-card';
import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../../../utils/relational-entity-helper';

@Entity({
  name: 'striga_card',
})
export class StrigaCardEntity extends EntityRelationalHelper {
  @Column({
    nullable: true,
    type: String,
    unique: true,
  })
  externalId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  status?: string | null;

  @Column({
    nullable: false,
    type: String,
    default: StrigaCardType.VIRTUAL,
  })
  type!: StrigaCardType;

  @Column({
    nullable: true,
    type: String,
  })
  maskedCardNumber?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  expiryData?: string | null;

  @Column({
    nullable: true,
    type: Boolean,
  })
  isEnrolledFor3dSecure?: boolean | null;

  @Column({
    nullable: true,
    type: Boolean,
  })
  isCard3dSecureActivated?: boolean | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  security?: StrigaCardSecurity | null;

  @Column({
    nullable: true,
    type: String,
  })
  linkedAccountId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  parentWalletId?: string | null;

  @Column({
    nullable: true,
    type: String,
  })
  linkedAccountCurrency?: string | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: null,
  })
  limits?: StrigaCardLimits | null;

  @Column({
    nullable: true,
    type: String,
  })
  blockType?: string | null;

  @ManyToOne(() => StrigaUserEntity, { eager: true, nullable: false })
  user: StrigaUserEntity;

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
