# Binance Provider Guide

## What’s inside
- **Transport**: REST via Api Gateway, WS via shared WS layer.
- **Modules**: `BinanceModule` (controllers/services), `BinanceBaseService` (gateway calls), `BinanceSocketService` (WS streaming).
- **DTOs**: Client-facing DTOs unchanged in `src/providers/binance/dto/*`.

## REST (Api Gateway)
- Endpoints registered in `config/binance-endpoints.config.ts` and accessed through `BinanceBaseService`:
  - `GET /api/v3/ticker/price` (`getTickerPrice`) – batch via `symbols` or single `symbol`.
  - `GET /api/v3/ticker/bookTicker` (`getBookTicker`) – mid-price derivation.
  - `GET /api/v3/klines` (`getKlines`) – OHLCV with optional `startTime/endTime/limit`.
  - `GET /api/v3/exchangeInfo` (`getExchangeInfo`) – symbol metadata; filtered to TRADING & spot allowed.
  - `GET /api/v3/ping` (`ping`), `GET /api/v3/time` (`getServerTime`) – readiness.
- Base service lives at `services/binance-base.service.ts`; it:
  - Injects `API_GATEWAY_BINANCE` client, resolves base URLs (primary + fallbacks api-gcp/api1-4), retries across them on failure.
  - Exposes typed methods returning base DTOs.
- Main service (`binance.service.ts`):
  - Toggles via `binance.enable` (BaseToggleableService).
  - Uses base service + mappers to produce existing client DTOs (price, klines, chart header/series, mid-price, supported-assets).
  - Readiness: `onModuleInit` runs `ping`; `isReady()` mirrors base readiness.
  - Business rules (unchanged): symbol normalization, interval validation, baseline change%, presets, fallbacks when batch ticker fails.

## WebSocket Streaming
- Implemented in `binance.socket.service.ts` on top of `WsConnectionManager` (shared WS layer with lock, reconnect, heartbeat, connection budget):
  - Streams opened with keys `binance:<feed>:<params>` to ensure cross-pod single upstream when WS locking is ON.
  - Feeds:
    - Per-symbol ticker: `<symbol>@ticker` → emits `price:{symbol}`.
    - Global ticker array: `!ticker@arr` → emits `price:all`.
    - Candles: `<symbol>@kline_<interval>` → emits `candle:{symbol}:{interval}`.
    - Mid-price: `<symbol>@bookTicker` → emits `chart:price:{symbol}` with mid derived from bid/ask.
    - Chart series: `<symbol>@kline_<interval>` with baseline/prev change handling; room `chart:series:{symbol}:{preset}`; honors `includeLive` (closed-only when false).
  - Ref-counted subscriptions per room; auto cleanup on disconnect/leave.
  - Heartbeat/ping handled by WS manager (Binance also sends pings every 20s; the `ws` client auto-pongs).
  - Connection budget (`WS_MAX_CONNECTIONS`, default 64) avoids exceeding Binance limits; lock-based leader election avoids duplicate upstreams in multi-pod.

## Configuration
- `binance.config.ts` keys (env):
  - `BINANCE_ENABLE` (bool)
  - `BINANCE_BASE_URL` (default https://api.binance.com)
  - `BINANCE_ALT_BASE_URLS` (comma list: api-gcp, api1-4)
  - `BINANCE_REQUEST_TIMEOUT_MS` (default 10000)
  - `BINANCE_DEFAULT_QUOTE_ASSET` (default USDT)
- WS layer (global): `WS_LOCK_ENABLE`, `WS_LOCK_REDIS_URL`, `WS_LOCK_TTL_MS`, `WS_LOCK_KEY_PREFIX`, `WS_MAX_CONNECTIONS`.

## Client-facing API (unchanged)
- Controller: `binance.controller.ts`
  - `GET /v1/binance/price?symbols=BTC_USDT,...`
  - `GET /v1/binance/history?symbol=BTCUSDT&interval=1m&limit=100`
  - `GET /v1/binance/supported-assets?quoteAsset=USDT`
  - `GET /v1/binance/chart/header?symbol=BTCUSDT&preset=today`
  - `GET /v1/binance/chart/series?...`
  - `GET /v1/binance/chart/mid-price?symbols=BTCUSDT,ETHUSDT`
  - `GET /v1/binance/chart/series-range?...`
- Response DTOs remain exactly as before; mapping handled server-side.

## Usage principles
- Always call main service methods; do not reach into base service from controllers/workflows.
- Use stream keys including provider + feed + params to avoid collisions (`binance:price:BTCUSDT`).
- Leave client DTOs untouched; any provider shape changes should be mapped inside mappers.
- Respect rate limits: batch ticker when possible; WS manager limits live connections.

## Tips
- For new streams, add a `ensureXStream` using `WsConnectionManager` with a descriptive label and normalized key; keep parsing minimal and defensive.
- For new REST endpoints, register in `binance-endpoints.config.ts`, add typed request/response DTOs, expose via base service, then map in main service.
- Health: `BinanceService.isReady()` → base client + ping success; consider exposing a health endpoint if needed.
