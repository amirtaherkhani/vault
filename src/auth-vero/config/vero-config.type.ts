export type VeroConfig = {
  jwksUri?: string;
  jwksUriCacheMaxAge: number;
  enableJwksValidation: boolean;
  apiBaseUrl: string;
  useExternalToken: boolean;
};
