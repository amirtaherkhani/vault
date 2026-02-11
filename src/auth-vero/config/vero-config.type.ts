export type VeroConfig = {
  jwksUri?: string;
  jwksUriCacheMaxAge: number;
  enableDynamicCache: boolean;
  apiBaseUrl: string;
  useExternalToken: boolean;
};
