import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { BinanceController } from './binance.controller';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';
import { BinanceSocketService } from './binance.socket.service';

@Module({
  providers: [BinanceService, BinanceSocketService, EnableGuard],
  controllers: [BinanceController],
  exports: [BinanceService, BinanceSocketService],
})
export class BinanceModule {}
