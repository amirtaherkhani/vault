import { Module } from '@nestjs/common';
import { AuthVeroService } from './auth-vero.service';
import { ConfigModule } from '@nestjs/config';
import { AuthVeroController } from './auth-vero.controller';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { VeroPayloadMapper } from './infrastructure/persistence/relational/mappers/vero.mapper';
import { UsersModule } from '../users/users.module';
import { VeroBearerStrategy } from './strategies/vero-bearer.strategy';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [ConfigModule, AuthModule, JwtModule, UsersModule, SessionModule],
  providers: [AuthVeroService, VeroPayloadMapper, VeroBearerStrategy], // Added VeroMapper here
  exports: [AuthVeroService],
  controllers: [AuthVeroController],
})
export class AuthVeroModule {}
