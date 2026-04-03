import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { QuotesHistoricalV2QueryDto } from '../dto/cmc-client.dto';

dayjs.extend(utc);

export type QuotesPreset = 'today' | 'week' | 'month' | 'year';

/**
 * Map legacy preset names to CMC historical quote query params.
 * Client-provided params should override these defaults.
 */
export function resolvePreset(
  preset: QuotesPreset,
): Partial<QuotesHistoricalV2QueryDto> {
  const now = dayjs.utc();

  switch (preset) {
    case 'today':
      return {
        interval: '5m',
        count: 288,
        time_end: now.toISOString(),
        time_start: now.subtract(1, 'day').toISOString(),
      };
    case 'week':
      return {
        interval: '15m',
        count: 672,
        time_end: now.toISOString(),
        time_start: now.subtract(7, 'day').toISOString(),
      };
    case 'month':
      return {
        interval: '1h',
        count: 720,
        time_end: now.toISOString(),
        time_start: now.subtract(30, 'day').toISOString(),
      };
    case 'year':
      return {
        interval: '1d',
        count: 365,
        time_end: now.toISOString(),
        time_start: now.subtract(1, 'year').toISOString(),
      };
    default:
      return {};
  }
}

export function isValidPreset(preset?: string): preset is QuotesPreset {
  return (
    preset === 'today' ||
    preset === 'week' ||
    preset === 'month' ||
    preset === 'year'
  );
}

/**
 * Merge preset values with user query and normalize to CMC expected fields.
 * - converts symbols -> symbol, ids -> id
 * - enforces convert/convert_id exclusivity and applies defaultFiat when absent
 * - defaults skip_invalid to true
 */
export function buildQuotesHistoricalDto(
  query: QuotesHistoricalV2QueryDto,
  defaultFiat: string,
) {
  const { preset, ...rest } = query ?? {};
  const presetPatch =
    preset && isValidPreset(preset) ? resolvePreset(preset) : {};

  const dto: any = {
    ...presetPatch,
    ...rest,
  };

  if (dto.symbols) {
    dto.symbol = dto.symbols;
    delete dto.symbols;
  }
  if (dto.ids) {
    dto.id = dto.ids;
    delete dto.ids;
  }
  if (dto.convert_id) {
    delete dto.convert;
  } else if (!dto.convert) {
    dto.convert = defaultFiat;
  }
  if (dto.skip_invalid === undefined) {
    dto.skip_invalid = true;
  }

  return dto;
}
