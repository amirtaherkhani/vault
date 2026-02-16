import { HttpMethod } from 'src/common/api-gateway/types/api-gateway-enum.type';

export type StrigaPathParamValue = string | number | boolean;

export type StrigaPathParams = Record<string, StrigaPathParamValue>;

export type StrigaEndpointName =
  | 'ping'
  | 'getUserById'
  | 'createUser'
  | 'createWallet'
  | 'updateUser'
  | 'getUserByEmail'
  | 'startKyc';

export type StrigaEndpointDefinition = {
  method: HttpMethod;
  path: string;
};

export type StrigaEndpoints = Record<
  StrigaEndpointName,
  StrigaEndpointDefinition
>;

export type StrigaCreateUserRequest = Record<string, unknown>;

export type StrigaCreateAccountRequest = Record<string, unknown>;

export type StrigaUpdateUserRequest = Record<string, unknown>;

export type StrigaUserByEmailRequest = {
  email: string;
};

export type StrigaKycRequest = Record<string, unknown>;
