import {
  GlobalStatsDto,
  MetadataResponseDto,
  PricesResponseDto,
} from '../../../../dto/cmc-client.dto';
import { CmcGlobalMetricsQuotesLatestDto } from '../../../../dto/cmc-global-metrics.dto';
import {
  CmcCryptoInfoV1Dto,
  CmcCryptoQuotesLatestV1Dto,
} from '../../../../dto/cmc-cryptocurrency.dto';

export function mapGlobalStats(
  payload: CmcGlobalMetricsQuotesLatestDto,
  fiat: string,
): GlobalStatsDto {
  const stats: any = payload?.data ?? payload;
  return {
    activeCryptocurrencies: stats?.active_cryptocurrencies,
    totalMarketCap: stats?.quote?.[fiat]?.total_market_cap,
    totalVolume24h: stats?.quote?.[fiat]?.total_volume_24h,
    bitcoinDominance: stats?.btc_dominance,
    ethDominance: stats?.eth_dominance,
    defiDominance: stats?.defi_dominance,
  };
}

export function mapPriceEntry(
  payload: CmcCryptoQuotesLatestV1Dto,
  symbol: string,
  fiat: string,
): PricesResponseDto {
  const data: any = (payload as any)?.data;
  const entry = data?.[symbol] || Object.values(data ?? {})[0];
  const quote = entry?.quote?.[fiat] ?? {};

  return {
    id: entry?.id,
    symbol: entry?.symbol,
    name: entry?.name,
    rank: entry?.cmc_rank,
    price: quote.price,
    volume_24h: quote.volume_24h,
    market_cap: quote.market_cap,
    marketCapChange24h: quote.percent_change_24h,
    percent_change_1h: quote.percent_change_1h,
    percent_change_24h: quote.percent_change_24h,
    percent_change_7d: quote.percent_change_7d,
    percent_change_30d: quote.percent_change_30d,
    circulatingSupply: entry?.circulating_supply ?? null,
    totalSupply: entry?.total_supply ?? null,
    maxSupply: entry?.max_supply ?? null,
    fullyDilutedMarketCap: quote.fully_diluted_market_cap,
    last_updated: quote.last_updated,
  };
}

export function mapMetadata(payload: CmcCryptoInfoV1Dto): MetadataResponseDto {
  const raw = (payload as any)?.data ?? {};
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries<any>(raw)) {
    mapped[key] = {
      name: value?.name,
      symbol: value?.symbol,
      logo: value?.logo,
      description: value?.description,
      slug: value?.slug,
      urls: value?.urls,
      date_added: value?.date_added,
    };
  }
  return { data: mapped };
}
