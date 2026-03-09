import {
  STRIGA_SUPPORTED_CARD_ASSET_NAMES,
  StrigaSupportedCardAssetName,
} from '../types/striga-const.type';

export const normalizeSupportedCurrency = (
  value: string | null | undefined,
): StrigaSupportedCardAssetName | undefined => {
  const upper = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (
    upper &&
    (STRIGA_SUPPORTED_CARD_ASSET_NAMES as readonly string[]).includes(upper)
  ) {
    return upper as StrigaSupportedCardAssetName;
  }
  return undefined;
};
