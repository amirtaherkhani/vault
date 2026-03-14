import { BadRequestException } from '@nestjs/common';
import { normalizeAssetPair } from '../binance.helper';
import { BinanceCandleDto } from '../dto/binance-klines.dto';

export function parseSymbolCsv(csv: string): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => normalizeAssetPair(s));
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
