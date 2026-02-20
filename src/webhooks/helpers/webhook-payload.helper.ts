export function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function pickFirstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = getNonEmptyString(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}
