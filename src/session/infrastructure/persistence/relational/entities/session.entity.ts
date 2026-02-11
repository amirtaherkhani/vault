import {
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';

import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'session',
})
export class SessionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserEntity, {
    eager: true,
  })
  @Index()
  user: UserEntity;

  @Column()
  hash: string;

  @Column({ type: String, nullable: true })
  deviceName?: string | null;

  @Column({ type: String, nullable: true })
  deviceType?: string | null;

  @Column({ type: String, nullable: true })
  appVersion?: string | null;

  @Column({ type: String, nullable: true })
  country?: string | null;

  @Column({ type: String, nullable: true })
  city?: string | null;

  @Column({ type: Date, nullable: true })
  lastUsedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
