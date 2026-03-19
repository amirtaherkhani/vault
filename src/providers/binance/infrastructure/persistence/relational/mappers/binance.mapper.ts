import {
  BinanceCandleDto,
  BinanceKlineRaw,
} from '../../../../dto/binance-klines.dto';
import { BinanceSupportedAssetDto } from '../../../../dto/binance-account.dto';
import { BinanceChartMidPriceDto } from '../../../../dto/binance-chart.dto';
import { BinancePriceDto } from '../../../../dto/binance-price.dto';
import {
  BinanceBookTickerResponseDto,
  BinanceExchangeInfoResponseDto,
  BinanceTickerPriceResponseDto,
} from '../../../../dto/binance-base.response.dto';

export class BinanceMapper {
  static toLatestPrices(
    payload: BinanceTickerPriceResponseDto | BinanceTickerPriceResponseDto[],
  ): BinancePriceDto[] {
    const arr = Array.isArray(payload) ? payload : [payload];
    return arr.map((item) => {
      if (!item?.symbol) {
        throw new Error('Binance ticker item missing symbol');
      }
      const price =
        item.price !== undefined && item.price !== null
          ? String(item.price)
          : null;
      return {
        symbol: item.symbol,
        price,
        source: 'rest' as const,
      };
    });
  }

  static toMidPrices(
    payload: BinanceBookTickerResponseDto | BinanceBookTickerResponseDto[],
  ): BinanceChartMidPriceDto[] {
    const arr = Array.isArray(payload) ? payload : [payload];
    return arr.map((item) => {
      const bid = Number(item.bidPrice);
      const ask = Number(item.askPrice);
      const mid =
        Number.isFinite(bid) && Number.isFinite(ask)
          ? ((bid + ask) / 2).toString()
          : null;
      return {
        symbol: item.symbol,
        price: mid,
        source: 'rest:mid',
      };
    });
  }

  static toCandles(
    klines: BinanceKlineRaw[],
    opts: { source: BinanceCandleDto['source']; now?: number },
  ): BinanceCandleDto[] {
    const now = opts.now ?? Date.now();
    return klines.map((k) => ({
      openTime: k[0],
      open: k[1],
      high: k[2],
      low: k[3],
      close: k[4],
      volume: k[5],
      closeTime: k[6],
      closed: now >= k[6],
      source: opts.source,
    }));
  }

  static toSupportedAssets(
    exchangeInfo: BinanceExchangeInfoResponseDto,
    quoteAsset?: string,
  ): BinanceSupportedAssetDto[] {
    const resolved = Array.isArray(exchangeInfo?.symbols)
      ? exchangeInfo.symbols
      : [];

    const filtered = resolved.filter((s) => {
      const matchStatus = s.status === 'TRADING';
      const spotAllowed = s.isSpotTradingAllowed !== false;
      const quoteMatch = quoteAsset
        ? s.quoteAsset === quoteAsset.toUpperCase()
        : true;
      return matchStatus && spotAllowed && quoteMatch;
    });

    return filtered.map((s) => ({
      symbol: `${s.baseAsset}_${s.quoteAsset}`,
      baseAsset: s.baseAsset,
      quoteAsset: s.quoteAsset,
    }));
  }
}
