import { ApiGatewayConfig } from 'src/common/api-gateway/api-gateway-config';
import { HttpMethod } from 'src/common/api-gateway/types/api-gateway-enum.type';
import {
  BINANCE_REQUEST_TIMEOUT_MS,
  BINANCE_BASE_URL,
} from '../types/binance-const.type';
import { BINANCE_ENDPOINT_NAME } from '../types/binance-base.type';

export class BinanceApiConfig extends ApiGatewayConfig {
  constructor() {
    super(
      BINANCE_BASE_URL,
      {
        Accept: 'application/json',
      },
      {
        retry: {
          retries: 1,
          delayMs: 100,
          maxDelayMs: 500,
        },
      },
    );

    this.name = 'BINANCE';

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.tickerPrice,
      HttpMethod.GET,
      '/api/v3/ticker/price',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.bookTicker,
      HttpMethod.GET,
      '/api/v3/ticker/bookTicker',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.klines,
      HttpMethod.GET,
      '/api/v3/klines',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.uiKlines,
      HttpMethod.GET,
      '/api/v3/uiKlines',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.exchangeInfo,
      HttpMethod.GET,
      '/api/v3/exchangeInfo',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.ping,
      HttpMethod.GET,
      '/api/v3/ping',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );

    this.addEndpoint(
      BINANCE_ENDPOINT_NAME.time,
      HttpMethod.GET,
      '/api/v3/time',
      { timeoutMs: BINANCE_REQUEST_TIMEOUT_MS },
    );
  }
}
