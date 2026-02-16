// src/providers/providers.module.ts
import { Module } from '@nestjs/common';
import { ApiGatewayModule } from '../common/api-gateway/api-gateway.module';
import { CmcApiConfig } from './cmc/config/cmc-endpoints.config';
import { GorushApiConfig } from './gorush/config/gorush-endpoints.config';
import { StrigaApiConfig } from './striga/config/striga-endpoints.config';

@Module({
  imports: [
    ApiGatewayModule.register([
      new CmcApiConfig(),
      new GorushApiConfig(),
      new StrigaApiConfig(),
    ]),
  ],
  exports: [ApiGatewayModule],
})
export class ProvidersModule {}
