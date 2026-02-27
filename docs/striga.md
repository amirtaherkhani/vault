# Striga Developer Guide

## What This Integration Does

This integration keeps Striga user and wallet state synchronized with local DB after:

- Vero login (`VERO_LOGIN_USER_LOGGED_IN_EVENT`)
- Vero user created (`VERO_LOGIN_USER_ADDED_EVENT`)
- Striga KYC webhook (`STRIGA_WEBHOOK_KYC_EVENT`)

## Core Provider Model

Striga model is:

`user -> wallet -> accounts`

Notes:

- Wallet is the top-level financial container.
- A wallet contains multiple currency sub-accounts (`BTC`, `ETH`, `EUR`, ...).

## Local Mapping Rules

For Striga provider rows in local `account` table:

- `account.providerName = striga`
- `account.accountId = walletId` (not currency accountId)
- `account.customerRefId = walletId`
- `account.name = wallet-1`
- Only one wallet is stored locally (primary wallet).

For Striga card recovery:

- Local `striga_card.parentWalletId` maps to Striga `walletId`.
- Local `striga_card.linkedAccountId` maps to Striga wallet sub-account id (`accounts.<ASSET>.accountId`).
- Workflow only manages virtual cards.

## ID Semantics

- `userId`: app user id.
- `externalId` in `striga_user`: Striga cloud user id.
- `account.accountId` (for Striga provider): Striga wallet id.

## How It Works

### 1) User Recovery

When login/create events arrive:

1. Check local `striga_user` by email.
2. If missing or stale, check Striga cloud and upsert local.
3. If cloud user not found, create user in Striga, then upsert local.

Main code:

- `src/providers/striga/services/striga-user-workflow.service.ts`

### 2) KYC Snapshot Sync

When KYC webhook arrives:

1. Resolve local Striga user by `externalId`.
2. Update local `striga_user.kyc`.
3. Run wallet/account recovery if KYC tier conditions allow.

Main code:

- `src/providers/striga/services/striga-user-workflow.service.ts`
- `src/providers/striga/events/striga-user.event.handler.ts`

### 3) Wallet Resolution Strategy

Wallet resolution always targets one primary wallet:

1. If local wallet id exists (`account.accountId`), verify via `/wallets/get/account`.
2. If wallet id is missing or unresolved, call `/wallets/get/all` by Striga `externalId`.
3. For `/wallets/get/all` payload:
   - `startDate` = Striga cloud user `createdAt`
   - `endDate` = current request timestamp
   - `page` = `1`
4. If multiple wallets exist, select the first wallet from provider list order (`wallets[0]`).

Helper location:

- `src/providers/striga/helpers/striga-wallet.helper.ts`

### 4) Card Recovery/Creation Strategy

Card workflow is triggered after local STRIGA account recovery succeeds.

1. Read local STRIGA account row for app user (`providerName = striga`).
2. Use wallet id from local `account.accountId`.
3. Fetch cloud cards by Striga user and recover wallet cards into local `striga_card`.
4. Fetch wallet sub-accounts via `/wallets/get` and filter by configured assets.
5. Create missing virtual cards (`nameOnCard = Vero Vault`) and save locally.

Main code:

- `src/providers/striga/services/striga-card-workflow.service.ts`

Config:

- `STRIGA_CARD_ASSET_NAMES` (default `EUR`)
- `STRIGA_CARD_DEFAULT_PASSWORD` (default `VeroVault123!`)

## How To Extend Safely

If you add new Striga features:

- Keep wallet-first mapping intact (`account.accountId = walletId`).
- Never map local `account.accountId` to Striga currency sub-account id.
- Reuse wallet helper for payload parsing and wallet selection.
- Keep workflow orchestration in `striga-user-workflow.service.ts`.
- Keep provider calls in Striga services, not in handlers/controllers.

## Quick Debug Checklist

If local wallet is missing after tier1 approval:

1. Check `STRIGA_WEBHOOK_KYC_EVENT` is consumed.
2. Check local `striga_user.externalId` exists.
3. Check wallet calls order: `/wallets/get/account` -> `/wallets/get` -> `/wallets/get/all`.
4. Check selected wallet id is written to local `account.accountId`.
