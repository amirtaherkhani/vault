import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { BinanceController } from './binance.controller';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { BinanceSocketService } from './binance.socket.service';
import { ProvidersModule } from '../providers.module';
import { BinanceBaseService } from './services/binance-base.service';
import { WsModule } from 'src/common/ws/ws.module';

@Module({
  imports: [ProvidersModule, WsModule],
  providers: [
    BinanceBaseService,
    BinanceService,
    BinanceSocketService,
    EnableGuard,
  ],
  controllers: [BinanceController],
  exports: [BinanceBaseService, BinanceService, BinanceSocketService],
})
export class BinanceModule {}
