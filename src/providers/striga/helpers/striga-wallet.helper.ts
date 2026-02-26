export type StrigaWalletSummary = {
  walletId: string;
  subAccountIds: string[];
  subCurrencies: string[];
  createdAt: string | null;
  walletCount: number | null;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function toRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const records: Record<string, unknown>[] = [];
  for (const item of value) {
    const record = toRecord(item);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

function toCreatedAtTimestamp(value: unknown): number {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const ts = Date.parse(value);
  return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
}

function getWalletCountHint(data: unknown): number | null {
  const record = toRecord(data);
  if (!record) {
    return null;
  }

  if (typeof record.count === 'number' && Number.isFinite(record.count)) {
    return record.count;
  }

  if (typeof record.total === 'number' && Number.isFinite(record.total)) {
    return record.total;
  }

  if (record.data) {
    return getWalletCountHint(record.data);
  }

  if (record.result) {
    return getWalletCountHint(record.result);
  }

  return null;
}

function extractWalletRecords(data: unknown): Record<string, unknown>[] {
  if (!data) {
    return [];
  }

  const asList = toRecordList(data);
  if (asList.length > 0) {
    return asList;
  }

  const record = toRecord(data);
  if (!record) {
    return [];
  }

  if (
    (typeof record.parentWalletId === 'string' ||
      typeof record.parentWalletId === 'number') &&
    String(record.parentWalletId).trim().length > 0
  ) {
    return [record];
  }

  if (
    (typeof record.walletId === 'string' ||
      typeof record.walletId === 'number') &&
    String(record.walletId).trim().length > 0
  ) {
    return [record];
  }

  const wallets = toRecordList(record.wallets);
  if (wallets.length > 0) {
    return wallets;
  }

  const walletRecord = toRecord(record.wallet);
  if (walletRecord) {
    return [walletRecord];
  }

  if (record.data) {
    return extractWalletRecords(record.data);
  }

  if (record.result) {
    return extractWalletRecords(record.result);
  }

  return [];
}

function mapWalletSummary(
  walletRecord: Record<string, unknown>,
  walletCount: number | null,
): StrigaWalletSummary | null {
  const walletId = String(
    walletRecord.walletId ?? walletRecord.parentWalletId ?? '',
  ).trim();
  if (!walletId) {
    return null;
  }

  const createdAtRaw = walletRecord.createdAt;
  const createdAt =
    typeof createdAtRaw === 'string' && createdAtRaw.trim().length > 0
      ? createdAtRaw
      : null;

  const subAccountIds: string[] = [];
  const subCurrencies: string[] = [];
  const accounts = walletRecord.accounts;
  if (accounts && typeof accounts === 'object' && !Array.isArray(accounts)) {
    for (const [currency, account] of Object.entries(
      accounts as Record<string, unknown>,
    )) {
      const normalizedCurrency = String(currency ?? '').trim();
      if (normalizedCurrency.length > 0) {
        subCurrencies.push(normalizedCurrency);
      }

      const accountRecord = toRecord(account);
      if (!accountRecord) {
        continue;
      }

      const accountId = String(accountRecord.accountId ?? '').trim();
      if (accountId.length > 0) {
        subAccountIds.push(accountId);
      }
    }
  }

  // /wallets/get/account may return a single sub-account payload.
  if (subAccountIds.length === 0) {
    const accountId = String(walletRecord.accountId ?? '').trim();
    if (accountId.length > 0) {
      subAccountIds.push(accountId);
    }
  }

  if (subCurrencies.length === 0) {
    const currency = String(walletRecord.currency ?? '').trim();
    if (currency.length > 0) {
      subCurrencies.push(currency);
    }
  }

  return {
    walletId,
    subAccountIds,
    subCurrencies,
    createdAt,
    walletCount,
  };
}

export function extractPrimaryWalletSummaryFromPayload(
  data: unknown,
): StrigaWalletSummary | null {
  const walletRecords = extractWalletRecords(data);
  if (walletRecords.length === 0) {
    return null;
  }

  // First wallet is selected by the earliest createdAt.
  const sortedWallets = [...walletRecords].sort((left, right) => {
    return (
      toCreatedAtTimestamp(left.createdAt) - toCreatedAtTimestamp(right.createdAt)
    );
  });
  const primaryWallet = sortedWallets[0];

  const walletCount = getWalletCountHint(data) ?? walletRecords.length;
  return mapWalletSummary(primaryWallet, walletCount);
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
      return asNumber;
    }

    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate)) {
      return asDate;
    }
  }

  return null;
}

export function resolveWalletsDateRangeFromProviderUser(
  providerUser: Record<string, unknown> | null,
  requestTs: number = Date.now(),
): { startDate: number; endDate: number } {
  const fallbackStartDate = requestTs - 90 * 24 * 60 * 60 * 1000;
  const providerCreatedAt = toTimestamp(providerUser?.createdAt);

  return {
    startDate: providerCreatedAt ?? fallbackStartDate,
    endDate: requestTs,
  };
}

export function buildFindAllWalletsPayload(params: {
  userId: string;
  startDate: number;
  endDate: number;
}): Record<string, unknown> {
  return {
    userId: params.userId,
    startDate: params.startDate,
    endDate: params.endDate,
    page: 1,
  };
}
