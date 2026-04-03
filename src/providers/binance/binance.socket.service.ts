import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { Socket } from 'socket.io';
import { WsConnectionManager } from 'src/common/ws/ws-connection.manager';
import { LoggerService } from 'src/common/logger/logger.service';
import { SocketServerProvider } from 'src/communication/socketio/utils/socketio.provider';
import type { Server } from 'socket.io';
import { AllConfigType } from 'src/config/config.type';
import { BinanceService } from './binance.service';
import {
  BINANCE_PRESET_TO_INTERVAL,
  BinanceChartPreset,
} from './types/binance-const.type';
import { tryNormalizeSymbol, streamKey } from './helper/binance-socket.helper';
import { computeBaselineStats } from './helper/binance-service.helper';
import { BinanceCandleDto } from './dto/binance-klines.dto';
import { WsSubscription } from 'src/common/ws/types/ws-client.types';

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/ws';

type CandlePayload = BinanceCandleDto & {
  prevChangePercent?: number | null;
};

type StreamState = {
  refs: number;
  sub: WsSubscription;
};

type ChartSeriesState = StreamState & {
  baselineOpen: number | null;
  lastClose: number | null;
  closedOnly: boolean;
  symbol: string;
  preset: BinanceChartPreset;
  interval: string;
};

@Injectable()
export class BinanceSocketService {
  private readonly priceStreams = new Map<string, StreamState>();
  private readonly candleStreams = new Map<string, StreamState>();
  private readonly midStreams = new Map<string, StreamState>();
  private readonly globalPriceStreams = new Map<string, StreamState>(); // single key
  private readonly chartSeriesStreams = new Map<string, ChartSeriesState>();

  constructor(
    private readonly logger: LoggerService,
    private readonly socketProvider: SocketServerProvider,
    @Inject(forwardRef(() => BinanceService))
    private readonly binance: BinanceService,
    private readonly ws: WsConnectionManager,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  private get isEnabled(): boolean {
    return this.configService.get('binance.enable', { infer: true }) ?? false;
  }

  isReady(): boolean {
    return this.isEnabled && Boolean(this.getServerSafe());
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async testConnectivity(): Promise<{ ok: boolean; message: string }> {
    if (!this.isEnabled) {
      return { ok: false, message: 'Binance socket disabled' };
    }
    const server = this.getServerSafe();
    if (!server) {
      return { ok: false, message: 'Socket.IO server not ready' };
    }
    return { ok: true, message: 'Binance socket layer is ready' };
  }

  private getServerSafe(): Server | null {
    const srv = this.socketProvider.getServer?.();
    if (!srv) {
      this.logger.debug(
        'Socket.IO server is not ready; skipping emit.',
        BinanceSocketService.name,
      );
      return null;
    }
    return srv;
  }

  private normSymbol(symbol: string): string | null {
    const norm = tryNormalizeSymbol(symbol);
    if (!norm) {
      this.logger.debug(
        `Binance symbol normalize error: ${symbol}`,
        BinanceSocketService.name,
      );
    }
    return norm;
  }

  // ---------------------------------------------------------------------------
  // Public subscribe APIs
  // ---------------------------------------------------------------------------
  async subscribePrices(socket: Socket, symbols: string[]) {
    if (!this.isEnabled || !Array.isArray(symbols)) return;
    const normalized = symbols
      .map((s) => this.normSymbol(String(s)))
      .filter((s): s is string => Boolean(s));
    for (const symbol of normalized) {
      await socket.join(`price:${symbol}`);
      this.ensurePriceStream(symbol);
    }
  }

  async subscribeCandles(
    socket: Socket,
    candles: { symbol: string; interval: string }[],
  ) {
    if (!this.isEnabled || !Array.isArray(candles)) return;
    for (const c of candles) {
      if (!c?.symbol || !c?.interval) continue;
      const symbol = this.normSymbol(String(c.symbol));
      if (!symbol) continue;
      const interval = String(c.interval);
      await socket.join(`candle:${symbol}:${interval}`);
      this.ensureCandleStream(symbol, interval);
    }
  }

  async subscribeAllPrices(socket: Socket) {
    if (!this.isEnabled) return;
    await socket.join('price:all');
    this.ensureGlobalPriceStream();
  }

  async subscribeMidPrices(socket: Socket, symbols: string[]) {
    if (!this.isEnabled || !Array.isArray(symbols)) return;
    const normalized = symbols
      .map((s) => this.normSymbol(String(s)))
      .filter((s): s is string => Boolean(s));
    for (const symbol of normalized) {
      await socket.join(`chart:price:${symbol}`);
      this.ensureMidStream(symbol);
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
    await socket.join(room);
    socket.emit(`${room}:ack`, { ok: true });

    const { points, interval } = await this.binance.getSeriesByPreset(
      symbol,
      preset,
      payload?.limit,
      true,
    );
    const base = await this.binance.getBaselineOpen(symbol, preset);
    const baselineOpen = base.baselineOpen ?? null;
    const { priceStr, changePercent } = computeBaselineStats(
      points,
      baselineOpen,
    );

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
    this.ensureChartSeriesStream(symbol, preset, baselineOpen, includeLive);
  }

  async unsubscribeChartSeries(
    socket: Socket,
    payload: { symbol: string; preset: BinanceChartPreset },
  ) {
    if (!this.isEnabled) return;
    const symbol = this.normSymbol(String(payload?.symbol || ''));
    const preset = payload?.preset;
    if (!symbol || !preset || !(preset in BINANCE_PRESET_TO_INTERVAL)) return;

    const room = `chart:series:${symbol}:${preset}`;
    await socket.leave(room);
    this.releaseChartSeriesStream(symbol, preset);
  }

  handleDisconnect(socket: Socket) {
    if (!this.isEnabled) return;
    for (const room of socket.rooms) {
      if (room.startsWith('chart:series:')) {
        const parts = room.split(':');
        if (parts.length === 4) {
          const symbol = this.normSymbol(parts[2]);
          const preset = parts[3] as BinanceChartPreset;
          if (symbol && preset) this.releaseChartSeriesStream(symbol, preset);
        }
      } else if (room.startsWith('price:') && room !== 'price:all') {
        const symbol = room.slice('price:'.length);
        this.releasePriceStream(symbol);
      } else if (room.startsWith('candle:')) {
        const [, sym, interval] = room.split(':');
        if (sym && interval) this.releaseCandleStream(sym, interval);
      } else if (room.startsWith('chart:price:')) {
        const symbol = room.slice('chart:price:'.length);
        this.releaseMidStream(symbol);
      } else if (room === 'price:all') {
        this.releaseGlobalPriceStream();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Ensure stream helpers
  // ---------------------------------------------------------------------------
  private ensurePriceStream(symbol: string) {
    const key = streamKey('price', symbol);
    const current = this.priceStreams.get(key);
    if (current) {
      current.refs += 1;
      return;
    }

    const stream = `${symbol.toLowerCase()}@ticker`;
    const url = `${BINANCE_WS_BASE}/${stream}`;

    const sub = this.ws.subscribe(
      key,
      url,
      {
        onMessage: (data: WebSocket.RawData) => {
          try {
            const payload = JSON.parse(data.toString());
            const price = String(payload?.c ?? '');
            if (!price) return;
            const srv = this.getServerSafe();
            if (!srv) return;
            srv
              .to(`price:${symbol}`)
              .emit(`price:${symbol}`, { symbol, price });
          } catch (err) {
            this.logger.debug(
              `Binance price parse error: ${(err as Error).message}`,
              BinanceSocketService.name,
            );
          }
        },
        onError: (err) => {
          const message = (err as Error)?.message ?? String(err);
          this.logger.error(
            `Binance price stream error ${symbol}: ${message}`,
            BinanceSocketService.name,
          );
        },
      },
      { label: `binance:price:${symbol}` },
    );

    this.priceStreams.set(key, { refs: 1, sub });
  }

  private releasePriceStream(symbol: string) {
    const key = streamKey('price', symbol);
    const state = this.priceStreams.get(key);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.sub.unsubscribe();
      this.priceStreams.delete(key);
    }
  }

  private ensureCandleStream(symbol: string, interval: string) {
    const key = streamKey('candle', symbol, interval);
    const existing = this.candleStreams.get(key);
    if (existing) {
      existing.refs += 1;
      return;
    }
    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const url = `${BINANCE_WS_BASE}/${stream}`;

    const sub = this.ws.subscribe(
      key,
      url,
      {
        onMessage: (data: WebSocket.RawData) => {
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
            const srv = this.getServerSafe();
            if (!srv) return;
            srv
              .to(`candle:${symbol}:${interval}`)
              .emit(`candle:${symbol}:${interval}`, candle);
          } catch (err) {
            this.logger.debug(
              `Binance candle parse error: ${(err as Error).message}`,
              BinanceSocketService.name,
            );
          }
        },
        onError: (err) => {
          const message = (err as Error)?.message ?? String(err);
          this.logger.error(
            `Binance candle stream error ${symbol}:${interval}: ${message}`,
            BinanceSocketService.name,
          );
        },
      },
      { label: `binance:candle:${symbol}:${interval}` },
    );

    this.candleStreams.set(key, { refs: 1, sub });
  }

  private releaseCandleStream(symbol: string, interval: string) {
    const key = streamKey('candle', symbol, interval);
    const state = this.candleStreams.get(key);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.sub.unsubscribe();
      this.candleStreams.delete(key);
    }
  }

  private ensureGlobalPriceStream() {
    const key = streamKey('price', 'all');
    const existing = this.globalPriceStreams.get(key);
    if (existing) {
      existing.refs += 1;
      return;
    }

    const url = `${BINANCE_WS_BASE}/!ticker@arr`;
    const sub = this.ws.subscribe(
      key,
      url,
      {
        onMessage: (data: WebSocket.RawData) => {
          try {
            const arr = JSON.parse(data.toString());
            if (!Array.isArray(arr)) return;
            for (const t of arr) {
              const symbol = String(t.s);
              const price = String(t.c);
              if (!symbol || !price) continue;
              const srv = this.getServerSafe();
              if (!srv) return;
              srv.to('price:all').emit('price:all', { symbol, price });
            }
          } catch (err) {
            this.logger.debug(
              `Binance global price parse error: ${(err as Error).message}`,
              BinanceSocketService.name,
            );
          }
        },
        onError: (err) => {
          const message = (err as Error)?.message ?? String(err);
          this.logger.error(
            `Binance global price stream error: ${message}`,
            BinanceSocketService.name,
          );
        },
      },
      { label: 'binance:price:all' },
    );

    this.globalPriceStreams.set(key, { refs: 1, sub });
  }

  private releaseGlobalPriceStream() {
    const key = streamKey('price', 'all');
    const state = this.globalPriceStreams.get(key);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.sub.unsubscribe();
      this.globalPriceStreams.delete(key);
    }
  }

  private ensureMidStream(symbol: string) {
    const key = streamKey('mid', symbol);
    const existing = this.midStreams.get(key);
    if (existing) {
      existing.refs += 1;
      return;
    }
    const stream = `${symbol.toLowerCase()}@bookTicker`;
    const url = `${BINANCE_WS_BASE}/${stream}`;

    const sub = this.ws.subscribe(
      key,
      url,
      {
        onMessage: (data: WebSocket.RawData) => {
          try {
            const payload = JSON.parse(data.toString());
            const bid = Number(payload?.b);
            const ask = Number(payload?.a);
            if (!Number.isFinite(bid) || !Number.isFinite(ask)) return;
            const mid = ((bid + ask) / 2).toString();
            const room = `chart:price:${symbol}`;
            const srv = this.getServerSafe();
            if (!srv) return;
            srv.to(room).emit(room, { symbol, price: mid, type: 'mid' });
          } catch (err) {
            this.logger.debug(
              `Binance mid price parse error: ${(err as Error).message}`,
              BinanceSocketService.name,
            );
          }
        },
        onError: (err) => {
          const message = (err as Error)?.message ?? String(err);
          this.logger.error(
            `Binance mid-price stream error ${symbol}: ${message}`,
            BinanceSocketService.name,
          );
        },
      },
      { label: `binance:mid:${symbol}` },
    );

    this.midStreams.set(key, { refs: 1, sub });
  }

  private releaseMidStream(symbol: string) {
    const key = streamKey('mid', symbol);
    const state = this.midStreams.get(key);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.sub.unsubscribe();
      this.midStreams.delete(key);
    }
  }

  private ensureChartSeriesStream(
    symbol: string,
    preset: BinanceChartPreset,
    baselineOpen: number | null,
    includeLive: boolean,
  ) {
    const interval = BINANCE_PRESET_TO_INTERVAL[preset];
    const key = streamKey('chart-series', symbol, preset);
    const existing = this.chartSeriesStreams.get(key);
    if (existing) {
      existing.refs += 1;
      return;
    }

    const stream = `${symbol.toLowerCase()}@kline_${interval}`;
    const url = `${BINANCE_WS_BASE}/${stream}`;
    const state: ChartSeriesState = {
      refs: 1,
      baselineOpen,
      lastClose: null,
      closedOnly: !includeLive,
      symbol,
      preset,
      interval,
      sub: this.ws.subscribe(
        key,
        url,
        {
          onMessage: (data: WebSocket.RawData) => {
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
              const srv = this.getServerSafe();
              if (!srv) return;
              srv.to(room).emit(room, candle);
            } catch (err) {
              this.logger.debug(
                `Binance chart series parse error: ${(err as Error).message}`,
                BinanceSocketService.name,
              );
            }
          },
          onError: (err) => {
            const message = (err as Error)?.message ?? String(err);
            this.logger.error(
              `Binance chart-series stream error ${symbol}:${preset}: ${message}`,
              BinanceSocketService.name,
            );
          },
        },
        { label: `binance:chart-series:${symbol}:${preset}` },
      ),
    };

    this.chartSeriesStreams.set(key, state);
  }

  private releaseChartSeriesStream(symbol: string, preset: BinanceChartPreset) {
    const key = streamKey('chart-series', symbol, preset);
    const state = this.chartSeriesStreams.get(key);
    if (!state) return;
    state.refs -= 1;
    if (state.refs <= 0) {
      state.sub.unsubscribe();
      this.chartSeriesStreams.delete(key);
    }
  }
}
