export const BINANCE_ENABLE = false;

export const BINANCE_BASE_URL = 'https://api.binance.com';
export const BINANCE_BASE_URLS = [
  'https://api.binance.com',
  'https://api-gcp.binance.com',
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api4.binance.com',
];

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

export const BINANCE_INTERVAL_MS: Record<BinanceKlineInterval, number> = {
  '1m': 60_000,
  '3m': 180_000,
  '5m': 300_000,
  '15m': 900_000,
  '30m': 1_800_000,
  '1h': 3_600_000,
  '2h': 7_200_000,
  '4h': 14_400_000,
  '6h': 21_600_000,
  '8h': 28_800_000,
  '12h': 43_200_000,
  '1d': 86_400_000,
  '3d': 259_200_000,
  '1w': 604_800_000,
  '1M': 2_629_800_000,
};

export const BINANCE_SYMBOL_REGEX =
  /^([A-Z0-9]+?)(?:_[A-Z]+)?_([A-Z0-9]+?)(?:_[A-Z]+)?$/;

export const BINANCE_WEEKDAY_MAP: number[] = [7, 1, 2, 3, 4, 5, 6]; // getUTCDay(): 0=Sun
