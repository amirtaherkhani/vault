export type BinanceConfig = {
  baseUrl: string;
  altBaseUrls?: string[];
  enable: boolean;
  requestTimeoutMs: number;
  defaultQuoteAsset: string;
};
