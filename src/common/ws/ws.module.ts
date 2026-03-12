import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';
import { WsConnectionManager } from './ws-connection.manager';
import { WsLockService } from './ws-lock.service';

@Module({
  imports: [LoggerModule, ConfigModule],
  providers: [WsLockService, WsConnectionManager],
  exports: [WsConnectionManager],
})
export class WsModule {}
