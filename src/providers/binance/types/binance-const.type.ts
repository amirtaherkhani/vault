export const BINANCE_ENABLE = false;

export const BINANCE_BASE_URL = 'https://api.binance.com';

export const BINANCE_REQUEST_TIMEOUT_MS = 10_000;

export const BINANCE_DEFAULT_QUOTE_ASSET = 'USDT';

export const BINANCE_MAX_KLINE_LIMIT = 1000;

export type BinanceChartPreset = 'today' | 'week' | 'month' | 'year';

export type BinanceKlineInterval =
  | '1m'
  | '3m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '2h'
  | '4h'
  | '6h'
  | '8h'
  | '12h'
  | '1d'
  | '3d'
  | '1w'
  | '1M';

export const BINANCE_PRESET_TO_INTERVAL: Record<
  BinanceChartPreset,
  BinanceKlineInterval
> = {
  today: '5m',
  week: '15m',
  month: '1h',
  year: '1d',
};

export const BINANCE_PRESET_WINDOW_MS: Record<BinanceChartPreset, number> = {
  today: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
};

export const BINANCE_VALID_INTERVALS: BinanceKlineInterval[] = [
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
];
