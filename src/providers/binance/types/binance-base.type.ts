export const BINANCE_ENDPOINT_NAME = {
  tickerPrice: 'tickerPrice',
  bookTicker: 'bookTicker',
  klines: 'klines',
  uiKlines: 'uiKlines',
  exchangeInfo: 'exchangeInfo',
  ping: 'ping',
  time: 'time',
  executionRules: 'executionRules',
} as const;

export type BinanceEndpointName =
  (typeof BINANCE_ENDPOINT_NAME)[keyof typeof BINANCE_ENDPOINT_NAME];

export type BinancePathParams = Record<string, string | number>;
