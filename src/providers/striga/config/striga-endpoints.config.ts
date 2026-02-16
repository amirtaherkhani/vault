import { ApiGatewayConfig } from 'src/common/api-gateway/api-gateway-config';
import { HttpMethod } from 'src/common/api-gateway/types/api-gateway-enum.type';
import { getStrigaBaseUrl } from '../striga.helper';
import { StrigaEndpoints } from '../types/striga-base.type';
import {
  STRIGA_MAX_RETRIES,
  STRIGA_REQUEST_TIMEOUT_MS,
  STRIGA_SANDBOX_BASE_URL,
} from '../types/striga-const.type';

export const STRIGA_ENDPOINTS: StrigaEndpoints = {
  ping: {
    method: HttpMethod.POST,
    path: '/ping',
  },
  getUserById: {
    method: HttpMethod.GET,
    path: '/user/{userId}',
  },
  createUser: {
    method: HttpMethod.POST,
    path: '/user/create',
  },
  createWallet: {
    method: HttpMethod.POST,
    path: '/wallets/create',
  },
  updateUser: {
    method: HttpMethod.PATCH,
    path: '/user/update',
  },
  getUserByEmail: {
    method: HttpMethod.POST,
    path: '/user/get-by-email',
  },
  startKyc: {
    method: HttpMethod.POST,
    path: '/user/kyc/start',
  },
};

export class StrigaApiConfig extends ApiGatewayConfig {
  constructor() {
    super(
      getStrigaBaseUrl(STRIGA_SANDBOX_BASE_URL),
      {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      {
        retry: {
          retries: STRIGA_MAX_RETRIES,
          delayMs: 200,
          maxDelayMs: 2000,
        },
      },
    );
    this.name = 'STRIGA';

    for (const [name, endpoint] of Object.entries(STRIGA_ENDPOINTS)) {
      this.addEndpoint(name, endpoint.method, endpoint.path, {
        timeoutMs: STRIGA_REQUEST_TIMEOUT_MS,
      });
    }
  }
}
