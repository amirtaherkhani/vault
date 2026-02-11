import type { SessionMetadata } from '../types/session-base.type';

const toLower = (value: string) => value.toLowerCase();

const HEADER_KEYS = {
  deviceName: ['x-device-name'],
  deviceType: ['x-device-type'],
  appVersion: ['x-app-version'],
  country: ['x-country'],
  city: ['x-city'],
};

const normalizeHeaderValue = (
  value: string | string[] | undefined,
): string | null => {
  if (Array.isArray(value)) {
    return value.length ? value[0].trim() || null : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const extractSessionMetadata = (
  headers: Record<string, string | string[] | undefined>,
): SessionMetadata => {
  const loweredHeaders: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    loweredHeaders[toLower(key)] = value;
  }

  const resolve = (keys: string[]): string | null => {
    for (const key of keys) {
      const value = normalizeHeaderValue(loweredHeaders[toLower(key)]);
      if (value) {
        return value;
      }
    }
    return null;
  };

  return {
    deviceName: resolve(HEADER_KEYS.deviceName),
    deviceType: resolve(HEADER_KEYS.deviceType),
    appVersion: resolve(HEADER_KEYS.appVersion),
    country: resolve(HEADER_KEYS.country),
    city: resolve(HEADER_KEYS.city),
  };
};
