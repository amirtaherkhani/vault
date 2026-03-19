import {
  BinanceChartPreset,
  BinanceKlineInterval,
  BINANCE_INTERVAL_MS,
  BINANCE_SYMBOL_REGEX,
  BINANCE_WEEKDAY_MAP,
} from './types/binance-const.type';

export function normalizeAssetPair(input: string): string {
  const cleaned = input.toUpperCase();
  if (/^[A-Z0-9]+$/.test(cleaned)) return cleaned;
  const match = cleaned.match(BINANCE_SYMBOL_REGEX);
  if (!match) throw new Error(`Invalid symbol format: ${input}`);
  const [, baseAsset, quoteAsset] = match;
  return `${baseAsset}${quoteAsset}`;
}

export function intervalMs(interval: BinanceKlineInterval): number {
  return BINANCE_INTERVAL_MS[interval] ?? 0;
}

function parseOffsetMinutes(tz?: string): number | null {
  if (!tz) return null;
  const match = tz.match(/^([+-]?)(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = parseInt(match[2], 10);
  const minutes = match[3] ? parseInt(match[3], 10) : 0;
  return sign * (hours * 60 + minutes);
}

function offsetMsAt(timeZone: string, utcMs: number): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date(utcMs));
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+0';
    const match = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!match) return 0;
    const sign = match[1] === '-' ? -1 : 1;
    const hours = parseInt(match[2], 10);
    const mins = match[3] ? parseInt(match[3], 10) : 0;
    return sign * (hours * 60 + mins) * 60_000;
  } catch {
    // fallback below
  }

  const offsetMinutes = parseOffsetMinutes(timeZone);
  if (offsetMinutes !== null) return offsetMinutes * 60_000;

  return 0;
}

function weekday1to7Local(utcMs: number, offsetMs: number): number {
  const wd = new Date(utcMs + offsetMs).getUTCDay(); // 0=Sun
  return BINANCE_WEEKDAY_MAP[wd] ?? 1;
}

/**
 * Returns the UTC timestamp for the start of the chart preset window
 * using the provided timeZone (IANA or +/-HH:MM). Defaults to Europe/Berlin
 * for backward compatibility.
 */
export function calendarAnchorStart(
  preset: BinanceChartPreset,
  timeZone = 'Europe/Berlin',
  nowUtc = Date.now(),
): number {
  const offset = offsetMsAt(timeZone, nowUtc);
  const local = new Date(nowUtc + offset);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth(); // 0-based
  const d = local.getUTCDate();

  const by = y;
  let bm = m;
  let bd = d;

  if (preset === 'week') {
    const wd = weekday1to7Local(nowUtc, offset); // Mon=1
    const daysFromMonday = wd - 1;
    const anchorLocalMs =
      Date.UTC(y, m, d, 0, 0, 0) - daysFromMonday * 86_400_000;
    return anchorLocalMs - offset;
  }

  if (preset === 'month') {
    bd = 1;
  } else if (preset === 'year') {
    bm = 0;
    bd = 1;
  }

  const anchorLocalMs = Date.UTC(by, bm, bd, 0, 0, 0);
  return anchorLocalMs - offset;
}
