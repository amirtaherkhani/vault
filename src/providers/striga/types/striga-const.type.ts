export const STRIGA_ENABLE = false;

export const STRIGA_SANDBOX_BASE_URL = 'https://www.sandbox.striga.com/api/v1';

export const STRIGA_REQUEST_TIMEOUT_MS = 10_000;

export const STRIGA_MAX_RETRIES = 2;

export const STRIGA_SUPPORTED_CARD_ASSET_NAMES = [
  'EUR',
  'BTC',
  'USDC',
  'ETH',
  'BNB',
  'POL',
  'SOL',
] as const;

export type StrigaSupportedCardAssetName =
  (typeof STRIGA_SUPPORTED_CARD_ASSET_NAMES)[number];

export const STRIGA_CARD_ASSET_NAMES: StrigaSupportedCardAssetName[] = ['EUR'];

export const STRIGA_CARD_DEFAULT_PASSWORD = 'VeroVault123!';
