export interface StrigaConfig {
  /** Whether Striga integration is enabled */
  enable: boolean;

  /** Whether StrigaUsersController endpoints are enabled */
  usersEndpointsEnable: boolean;

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
}
