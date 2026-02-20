import { createHash, createHmac } from 'crypto';
import { HttpMethod } from 'src/common/api-gateway/types/api-gateway-enum.type';
import { STRIGA_SANDBOX_BASE_URL } from './types/striga-const.type';
import { StrigaPathParams } from './types/striga-base.type';

type StrigaSignatureInput = {
  apiSecret: string;
  method: HttpMethod | string;
  endpoint: string;
  body?: unknown;
  timestamp?: string;
};

export type StrigaMobileLike = {
  countryCode?: string | null;
  number?: string | null;
};

export const STRIGA_PLACEHOLDER_MOBILE = Object.freeze({
  countryCode: '+372',
  number: '55555555',
});

export function getStrigaBaseUrl(
  defaultBaseUrl: string = STRIGA_SANDBOX_BASE_URL,
): string {
  const fromEnv = process.env.STRIGA_BASE_URL?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : defaultBaseUrl;
}

export function buildStrigaEndpointPath(
  template: string,
  params?: StrigaPathParams,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined || value === null
      ? ''
      : encodeURIComponent(String(value));
  });
}

/**
 * Striga HMAC format:
 * HMAC <timestamp>:<hex-digest>
 * where digest = sha256(secret, timestamp + METHOD + endpoint + md5(bodyJson))
 */
export function createStrigaHmacAuthorization({
  apiSecret,
  method,
  endpoint,
  body,
  timestamp,
}: StrigaSignatureInput): string {
  const time = timestamp ?? Date.now().toString();
  const hmac = createHmac('sha256', apiSecret);

  hmac.update(time);
  hmac.update(String(method).toUpperCase());
  hmac.update(endpoint);

  const contentHash = createHash('md5');
  contentHash.update(JSON.stringify(body ?? {}));
  hmac.update(contentHash.digest('hex'));

  return `HMAC ${time}:${hmac.digest('hex')}`;
}

export function getStrigaPlaceholderMobile(): {
  countryCode: string;
  number: string;
} {
  return {
    countryCode: STRIGA_PLACEHOLDER_MOBILE.countryCode,
    number: STRIGA_PLACEHOLDER_MOBILE.number,
  };
}

export function isStrigaPlaceholderMobile(mobile?: StrigaMobileLike | null): boolean {
  if (!mobile) {
    return false;
  }

  const countryCode = String(mobile.countryCode ?? '').trim();
  const number = String(mobile.number ?? '').trim();

  return (
    countryCode === STRIGA_PLACEHOLDER_MOBILE.countryCode &&
    number === STRIGA_PLACEHOLDER_MOBILE.number
  );
}
