import { BinanceChartPreset, BinanceKlineInterval } from './types/binance-const.type';

export function normalizeAssetPair(input: string): string {
  const cleaned = input.toUpperCase();
  if (/^[A-Z0-9]+$/.test(cleaned)) {
    return cleaned;
  }
  const regex = /^([A-Z0-9]+?)(?:_[A-Z]+)?_([A-Z0-9]+?)(?:_[A-Z]+)?$/;
  const match = cleaned.match(regex);
  if (!match) {
    throw new Error(`Invalid symbol format: ${input}`);
  }
  const [, baseAsset, quoteAsset] = match;
  return `${baseAsset}${quoteAsset}`;
}

export function intervalMs(interval: BinanceKlineInterval): number {
  const m: Record<BinanceKlineInterval, number> = {
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
  return m[interval] ?? 0;
}

function berlinOffsetMsAt(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    timeZoneName: 'shortOffset',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs));

  const tz = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+1';
  const match = tz.match(/GMT([+-])(\d{1,2})/);
  if (!match) return 3_600_000;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  return sign * hours * 3_600_000;
}

function berlinWeekday1to7(utcMs: number): number {
  const wdStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
  }).format(new Date(utcMs));
  const map: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };
  return map[wdStr] ?? 1;
}

export function berlinCalendarAnchorStart(preset: BinanceChartPreset): number {
  const nowUtc = Date.now();
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date(nowUtc))
    .split('-');
  const [yStr, mStr, dStr] = dateParts;
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  let by = y;
  let bm = m;
  let bd = d;

  if (preset === 'week') {
    const wd = berlinWeekday1to7(nowUtc);
    const daysFromMonday = wd - 1;
    const todayBerlinUTC0 = Date.UTC(y, m - 1, d, 0, 0, 0);
    const todayOffset = berlinOffsetMsAt(todayBerlinUTC0);
    const todayUTC = todayBerlinUTC0 - todayOffset;
    const mondayUTC = todayUTC - daysFromMonday * 86_400_000;
    const mondayParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Berlin',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date(mondayUTC))
      .split('-');
    by = parseInt(mondayParts[0], 10);
    bm = parseInt(mondayParts[1], 10);
    bd = parseInt(mondayParts[2], 10);
  } else if (preset === 'month') {
    bd = 1;
  } else if (preset === 'year') {
    bm = 1;
    bd = 1;
  }

  const candidateUTC0 = Date.UTC(by, bm - 1, bd, 0, 0, 0);
  const off = berlinOffsetMsAt(candidateUTC0);
  return candidateUTC0 - off;
}
