// src/providers/providers.module.ts
import { Module } from '@nestjs/common';
import { ApiGatewayModule } from '../common/api-gateway/api-gateway.module';
import { CmcApiConfig } from './cmc/config/cmc-endpoints.config';
import { GorushApiConfig } from './gorush/config/gorush-endpoints.config';
import { StrigaApiConfig } from './striga/config/striga-endpoints.config';
import { BinanceApiConfig } from './binance/config/binance-endpoints.config';

@Module({
  imports: [
    ApiGatewayModule.register([
      new CmcApiConfig(),
      new GorushApiConfig(),
      new StrigaApiConfig(),
      new BinanceApiConfig(),
    ]),
  ],
  exports: [ApiGatewayModule],
})
export class ProvidersModule {}
