import { HttpMethod } from './api-gateway-enum.type';

export interface ApiEndpoint {
  name: string; // Function name
  method: HttpMethod; // Use Enum
  url: string; // API URL
}

export interface ApiGatewayConfig {
  name: string; // Unique name for the instance
  baseUrl: string;
  endpoints: ApiEndpoint[];
  headers?: Record<string, string>; // Optional global headers
  retry?: {
    retries?: number;
    delayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    retryOnStatuses?: number[];
    retryOnMethods?: HttpMethod[];
  };
  transport?: {
    httpAgent?: any;
    httpsAgent?: any;
  };
}
