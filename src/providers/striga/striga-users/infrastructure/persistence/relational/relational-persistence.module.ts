import { Module } from '@nestjs/common';
import { StrigaUserRepository } from '../striga-user.repository';
import { StrigaUserRelationalRepository } from './repositories/striga-user.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrigaUserEntity } from './entities/striga-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StrigaUserEntity])],
  providers: [
    {
      provide: StrigaUserRepository,
      useClass: StrigaUserRelationalRepository,
    },
  ],
  exports: [StrigaUserRepository],
})
export class RelationalStrigaUserPersistenceModule {}
