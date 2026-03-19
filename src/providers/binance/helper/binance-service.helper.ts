import { BadRequestException } from '@nestjs/common';
import { normalizeAssetPair } from '../binance.helper';
import { BinanceCandleDto } from '../dto/binance-klines.dto';

// Common quote assets on Binance Spot (non-exhaustive, sorted by length desc to avoid partial matches)
const KNOWN_QUOTE_ASSETS = [
  'USDT',
  'FDUSD',
  'USDC',
  'TUSD',
  'BUSD',
  'USDP',
  'DAI',
  'BIDR',
  'BVND',
  'BKRW',
  'IDRT',
  'NGN',
  'TRY',
  'BRL',
  'EUR',
  'GBP',
  'RUB',
  'AUD',
  'UAH',
  'ZAR',
  'ARS',
  'BNB',
  'BTC',
  'ETH',
];

function splitSymbolDynamic(input: string): {
  baseAsset: string;
  quoteAsset: string;
} {
  const cleaned = input.trim().toUpperCase();
  // If underscore provided, trust it.
  if (cleaned.includes('_')) {
    const [baseAsset, quoteAsset] = cleaned.split('_');
    if (!baseAsset || !quoteAsset) {
      throw new BadRequestException(
        'Symbol must be in BASE_QUOTE format (e.g. BTC_USDT)',
      );
    }
    return { baseAsset, quoteAsset };
  }

  // Try to detect quote by known suffixes.
  for (const quote of KNOWN_QUOTE_ASSETS) {
    if (cleaned.endsWith(quote) && cleaned.length > quote.length) {
      const baseAsset = cleaned.slice(0, cleaned.length - quote.length);
      if (baseAsset) {
        return { baseAsset, quoteAsset: quote };
      }
    }
  }

  throw new BadRequestException(
    'Symbol must be in BASE_QUOTE format (e.g. BTC_USDT)',
  );
}

export function parseSymbolCsv(csv: string): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => normalizeAssetPair(s));
}

export function normalizeClientSymbolsCsv(csv: string): {
  normalized: string[];
  external: string[];
} {
  if (!csv) return { normalized: [], external: [] };
  const external: string[] = [];
  const normalized: string[] = [];

  csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((sym) => {
      const { baseAsset, quoteAsset } = splitSymbolDynamic(sym);
      external.push(`${baseAsset}_${quoteAsset}`);
      normalized.push(`${baseAsset}${quoteAsset}`);
    });

  return { normalized, external };
}

export function normalizeClientSymbol(symbol: string): {
  normalized: string;
  external: string;
} {
  const { baseAsset, quoteAsset } = splitSymbolDynamic(symbol);
  return {
    normalized: `${baseAsset}${quoteAsset}`,
    external: `${baseAsset}_${quoteAsset}`,
  };
}

export function normalizeSymbolsOrThrow(symbols: string[]): string[] {
  const normalized: string[] = [];
  for (const s of symbols) {
    try {
      normalized.push(normalizeAssetPair(s));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid symbol format';
      throw new BadRequestException(message);
    }
  }
  return normalized;
}

export function sliceCandles(
  points: BinanceCandleDto[],
  limit: number,
): BinanceCandleDto[] {
  return points.length > limit ? points.slice(-limit) : points;
}

export function computeBaselineStats(
  points: BinanceCandleDto[],
  baselineOpen: number | null,
): {
  baselineOpen: number | null;
  priceStr: string | null;
  changePercent: number | null;
} {
  const lastClose = points.length
    ? Number(points[points.length - 1].close)
    : NaN;
  const priceNow = Number.isFinite(lastClose) ? lastClose : NaN;
  const priceStr = Number.isFinite(priceNow) ? String(priceNow) : null;

  const changePercent =
    baselineOpen && baselineOpen > 0 && Number.isFinite(priceNow)
      ? ((priceNow - baselineOpen) / baselineOpen) * 100
      : null;

  return { baselineOpen, priceStr, changePercent };
}
