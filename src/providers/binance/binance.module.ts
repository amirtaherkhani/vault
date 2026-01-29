import { Module } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { BinanceController } from './binance.controller';
import { EnableGuard } from 'src/common/guards/service-enabled.guard';

@Module({
  providers: [BinanceService, EnableGuard],
  controllers: [BinanceController],
  exports: [BinanceService],
})
export class BinanceModule {}
