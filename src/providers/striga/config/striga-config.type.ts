export interface StrigaConfig {
  /** Whether Striga integration is enabled */
  enable: boolean;

  /** Striga application identifier */
  applicationId: string;

  /** API key used in `api-key` header */
  apiKey: string;

  /** API secret used to build HMAC authorization header */
  apiSecret: string;

  /** Secret used for Striga UI/webhook signature verification */
  uiSecret: string;

  /** Base URL of Striga API */
  baseUrl: string;

  /** Request timeout in milliseconds */
  requestTimeoutMs: number;

  /** Number of retries for idempotent failures */
  maxRetries: number;

  /**
   * Comma-separated asset symbols used for virtual card creation workflows.
   * Example env value: `BTC,USDC,ETH`
   */
  cardCreateAssetNames: string[];

  /**
   * Default 3DS password used for automatic virtual card creation workflows.
   */
  cardDefaultPassword: string;
}
