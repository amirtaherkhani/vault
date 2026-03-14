import { normalizeAssetPair } from '../binance.helper';

export function tryNormalizeSymbol(symbol: string): string | null {
  try {
    return normalizeAssetPair(symbol);
  } catch {
    return null;
  }
}

export function streamKey(
  feed: string,
  ...parts: Array<string | number>
): string {
  return ['binance', feed, ...parts].map((p) => String(p)).join(':');
}
