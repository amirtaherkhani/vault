import { HttpMethod } from 'src/common/api-gateway/types/api-gateway-enum.type';

export type StrigaPathParamValue = string | number | boolean;

export type StrigaPathParams = Record<string, StrigaPathParamValue>;

const STRIGA_ENDPOINT_NAMES = [
  'ping',
  'getUserById',
  'createUser',
  'createAccount',
  'updateUser',
  'updateVerifiedCredentials',
  'getUserByEmail',
  'verifyEmail',
  'resendEmail',
  'verifyMobile',
  'resendSms',
  'startKyc',
] as const;

function createKeyMirror<const T extends readonly string[]>(
  keys: T,
): { readonly [K in T[number]]: K } {
  const mirror = {} as { [K in T[number]]: K };
  for (const key of keys) {
    mirror[key] = key;
  }
  return Object.freeze(mirror);
}

export type StrigaEndpointName = (typeof STRIGA_ENDPOINT_NAMES)[number];

export const STRIGA_ENDPOINT_NAME = createKeyMirror(STRIGA_ENDPOINT_NAMES);

export type StrigaEndpointDefinition = {
  method: HttpMethod;
  path: string;
};

export type StrigaEndpoints = Record<
  StrigaEndpointName,
  StrigaEndpointDefinition
>;
