import { Injectable } from '@nestjs/common';
import WebSocket from 'ws';
import { LoggerService } from '../../common/logger/logger.service';
import { SocketServerProvider } from '../../communication/socketio/utils/socketio.provider';
import { BinanceService } from './binance.service';
import {
  BINANCE_PRESET_TO_INTERVAL,
  BinanceChartPreset,
} from './types/binance-const.type';
import { normalizeAssetPair } from './binance.helper';
import { Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

type CandlePayload = {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  closed?: boolean;
  source?: 'ws' | 'rest';
  changePercent?: number | null;
  prevChangePercent?: number | null;
};

type ChartSeriesState = {
  baselineOpen: number | null;
  interval: string;
  lastClose: number | null;
  closedOnly: boolean;
  refs: number;
  socket: WebSocket;
};

@Injectable()
export class BinanceSocketService {
  private readonly priceSockets = new Map<string, WebSocket>();
  private readonly candleSockets = new Map<string, WebSocket>();
  private readonly midSockets = new Map<string, WebSocket>();
  private readonly chartSeriesSockets = new Map<string, ChartSeriesState>();
  private globalPriceSocket: WebSocket | null = null;

  constructor(
    private readonly logger: LoggerService,
    private readonly socketProvider: SocketServerProvider,
    private readonly binance: BinanceService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private get isEnabled(): boolean {
    return this.configService.get('binance.enable', { infer: true }) ?? false;
  }

  private server() {
    return this.socketProvider.getServer?.() ?? this.socketProvider.server;
  }

  private normSymbol(symbol: string): string | null {
    try {
      return normalizeAssetPair(symbol);
    } catch (err) {
      this.logger.debug(
        `Binance symbol normalize error: ${(err as Error).message}`,
        BinanceSocketService.name,
      );
      return null;
    }
  }

  subscribePrices(socket: Socket, symbols: string[]) {
    if (!this.isEnabled || !Array.isArray(symbols)) return;
    const normalized = symbols
      .map((s) => this.normSymbol(String(s)))
      .filter((s): s is string => Boolean(s));
    for (const symbol of normalized) {
      socket.join(`price:${symbol}`);
      this.ensurePriceSocket(symbol);
    }
  }

  subscribeCandles(
    socket: Socket,
    candles: { symbol: string; interval: string }[],
  ) {
    if (!this.isEnabled || !Array.isArray(candles)) return;
    for (const c of candles) {
      if (!c?.symbol || !c?.interval) continue;
      const symbol = this.normSymbol(String(c.symbol));
      if (!symbol) continue;
      const interval = String(c.interval);
      socket.join(`candle:${symbol}:${interval}`);
      this.ensureCandleSocket(symbol, interval);
    }
  }

  subscribeAllPrices(socket: Socket) {
    if (!this.isEnabled) return;
    socket.join('price:all');
    this.ensureGlobalPriceSocket();
  }

  subscribeMidPrices(socket: Socket, symbols: string[]) {
    if (!this.isEnabled || !Array.isArray(symbols)) return;
    const normalized = symbols
      .map((s) => this.normSymbol(String(s)))
      .filter((s): s is string => Boolean(s));
    for (const symbol of normalized) {
      socket.join(`chart:price:${symbol}`);
      this.ensureMidSocket(symbol);
    }
  }

  async subscribeChartSeries(
    socket: Socket,
    payload: {
      symbol: string;
      preset: BinanceChartPreset;
      limit?: number;
      includeLive?: boolean;
    },
  ) {
    if (!this.isEnabled) return;
    const symbol = this.normSymbol(String(payload?.symbol || ''));
    const preset = payload?.preset;
    if (!symbol || !preset || !(preset in BINANCE_PRESET_TO_INTERVAL)) return;

    const room = `chart:series:${symbol}:${preset}`;
    socket.join(room);
    socket.emit(`${room}:ack`, { ok: true });

    const { points, interval } = await this.binance.getSeriesByPreset(
      symbol,
      preset,
      payload?.limit,
      true,
    );
    const base = await this.binance.getBaselineOpen(symbol, preset);
    const baselineOpen = base.baselineOpen ?? null;

    const lastClose = points.length
      ? Number(points[points.length - 1].close)
      : NaN;
    const priceNow = Number.isFinite(lastClose) ? lastClose : NaN;
    const priceStr = Number.isFinite(priceNow) ? String(priceNow) : null;

    const changePercent =
      baselineOpen && baselineOpen > 0 && Number.isFinite(priceNow)
        ? ((priceNow - baselineOpen) / baselineOpen) * 100
        : null;

    const initPayload = {
      symbol,
      preset,
      interval,
      baseline: { open: baselineOpen, time: base.baselineTime },
      price: priceStr,
      changePercent,
      points,
    };

    socket.emit(`${room}:init`, initPayload);

    const includeLive = payload?.includeLive !== false;
    this.ensureChartSeriesSocket(symbol, preset, baselineOpen, includeLive);
  }

  unsubscribeChartSeries(
    socket: Socket,
    payload: { symbol: string; preset: BinanceChartPreset },
  ) {
    if (!this.isEnabled) return;
    const symbol = this.normSymbol(String(payload?.symbol || ''));
    const preset = payload?.preset;
    if (!symbol || !preset || !(preset in BINANCE_PRESET_TO_INTERVAL)) return;

    const room = `chart:series:${symbol}:${preset}`;
    socket.leave(room);

    const key = this.chartSeriesKey(symbol, preset);
    const existing = this.chartSeriesSockets.get(key);
    if (!existing) return;
    existing.refs -= 1;
    if (existing.refs <= 0) {
      existing.socket.close();
      this.chartSeriesSockets.delete(key);
    }
  }

  handleDisconnect(socket: Socket) {
    if (!this.isEnabled) return;
    for (const room of socket.rooms) {
      if (typeof room !== 'string') continue;
      if (room.startsWith('chart:series:')) {
        const parts = room.split(':');
        if (parts.length === 4) {
          const symbol = this.normSymbol(parts[2]);
          if (!symbol) continue;
          const preset = parts[3] as BinanceChartPreset;
          this.unsubscribeChartSeries(socket, { symbol, preset });
        }
      }
    }
  }

  private ensurePriceSocket(symbol: string) {
    if (this.priceSockets.has(symbol)) return;
    const stream = `${symbol.toLowerCase()}@ticker`;
    const ws = new WebSocket(`${BINANCE_WS_BASE}/${stream}`);
    this.priceSockets.set(symbol, ws);

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const price = String(payload?.c ?? '');
        if (!price) return;
        this.server()
          .to(`price:${symbol}`)
          .emit(`price:${symbol}`, { symbol, price });
      } catch (err) {
        this.logger.debug(
          `Binance price parse error: ${(err as Error).message}`,
          BinanceSocketService.name,
        );
      }
    });

    ws.on('close', () => {
      this.priceSockets.delete(symbol);
    });

    ws.on('error', () => {
      this.priceSockets.delete(symbol);
    });
  }

  private ensureCandleSocket(symbol: string, interval: string) {
    const key = `${symbol}_${interval}`;
    if (this.candleSockets.has(key)) return;
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(`${BINANCE_WS_BASE}/${stream}`);
    this.candleSockets.set(key, ws);

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const k = payload?.k;
        if (!k) return;
        const candle: CandlePayload = {
          openTime: k.t,
          open: k.o,
          high: k.h,
          low: k.l,
          close: k.c,
          volume: k.v,
          closeTime: k.T,
          closed: k.x,
          source: 'ws',
        };
        this.server()
          .to(`candle:${symbol}:${interval}`)
          .emit(`candle:${symbol}:${interval}`, candle);
      } catch (err) {
        this.logger.debug(
          `Binance candle parse error: ${(err as Error).message}`,
          BinanceSocketService.name,
        );
      }
    });

    ws.on('close', () => {
      this.candleSockets.delete(key);
    });

    ws.on('error', () => {
      this.candleSockets.delete(key);
    });
  }

  private ensureGlobalPriceSocket() {
    if (this.globalPriceSocket && this.globalPriceSocket.readyState === WebSocket.OPEN) {
      return;
    }
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    this.globalPriceSocket = ws;

    ws.on('message', (data) => {
      try {
        const arr = JSON.parse(data.toString());
        if (!Array.isArray(arr)) return;
        for (const t of arr) {
          const symbol = String(t.s);
          const price = String(t.c);
          if (!symbol || !price) continue;
          this.server().to('price:all').emit('price:all', { symbol, price });
        }
      } catch (err) {
        this.logger.debug(
          `Binance global price parse error: ${(err as Error).message}`,
          BinanceSocketService.name,
        );
      }
    });

    ws.on('close', () => {
      this.globalPriceSocket = null;
    });

    ws.on('error', () => {
      this.globalPriceSocket = null;
    });
  }

  private ensureMidSocket(symbol: string) {
    if (this.midSockets.has(symbol)) return;
    const stream = `${symbol.toLowerCase()}@bookTicker`;
    const ws = new WebSocket(`${BINANCE_WS_BASE}/${stream}`);
    this.midSockets.set(symbol, ws);

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const bid = Number(payload?.b);
        const ask = Number(payload?.a);
        if (!Number.isFinite(bid) || !Number.isFinite(ask)) return;
        const mid = ((bid + ask) / 2).toString();
        const room = `chart:price:${symbol}`;
        this.server()
          .to(room)
          .emit(room, { symbol, price: mid, type: 'mid' });
      } catch (err) {
        this.logger.debug(
          `Binance mid price parse error: ${(err as Error).message}`,
          BinanceSocketService.name,
        );
      }
    });

    ws.on('close', () => {
      this.midSockets.delete(symbol);
    });

    ws.on('error', () => {
      this.midSockets.delete(symbol);
    });
  }

  private ensureChartSeriesSocket(
    symbol: string,
    preset: BinanceChartPreset,
    baselineOpen: number | null,
    includeLive: boolean,
  ) {
    const key = this.chartSeriesKey(symbol, preset);
    const existing = this.chartSeriesSockets.get(key);
    if (existing) {
      existing.refs += 1;
      return;
    }

    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const ws = new WebSocket(`${BINANCE_WS_BASE}/${stream}`);
    const state: ChartSeriesState = {
      baselineOpen,
      interval,
      lastClose: null,
      closedOnly: !includeLive,
      refs: 1,
      socket: ws,
    };
    this.chartSeriesSockets.set(key, state);

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data.toString());
        const k = payload?.k;
        if (!k) return;
        if (state.closedOnly && !k.x) return;

        const close = Number(k.c);
        const changePercent =
          state.baselineOpen && state.baselineOpen > 0
            ? ((close - state.baselineOpen) / state.baselineOpen) * 100
            : null;
        const prevChangePercent =
          state.lastClose && state.lastClose > 0
            ? ((close - state.lastClose) / state.lastClose) * 100
            : null;

        const candle: CandlePayload = {
          openTime: k.t,
          open: k.o,
          high: k.h,
          low: k.l,
          close: k.c,
          volume: k.v,
          closeTime: k.T,
          closed: k.x,
          source: 'ws',
          changePercent,
          prevChangePercent,
        };

        state.lastClose = close;
        const room = `chart:series:${symbol}:${preset}`;
        this.server().to(room).emit(room, candle);
      } catch (err) {
        this.logger.debug(
          `Binance chart series parse error: ${(err as Error).message}`,
          BinanceSocketService.name,
        );
      }
    });

    ws.on('close', () => {
      this.chartSeriesSockets.delete(key);
    });

    ws.on('error', () => {
      this.chartSeriesSockets.delete(key);
    });
  }

  private chartSeriesKey(symbol: string, preset: BinanceChartPreset) {
    return `${symbol}_${preset}`;
  }
}
