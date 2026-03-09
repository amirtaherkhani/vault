# Striga Developer Guide

## What This Integration Does

This integration keeps Striga user, wallet, and card state synchronized with the local DB after:

- Vero login (`VERO_LOGIN_USER_LOGGED_IN_EVENT`)
- Vero user created (`VERO_LOGIN_USER_ADDED_EVENT`)
- Striga KYC webhook (`STRIGA_WEBHOOK_KYC_EVENT`)
- KYC tier change internal event (`kyc:tier:update`)

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

For Striga card recovery/creation:

- Local `striga_card.parentWalletId` maps to Striga `walletId`.
- Local `striga_card.linkedAccountId` maps to Striga wallet sub-account id (`accounts.<ASSET>.accountId`).
- Local `striga_card.externalId` equals Striga card id (always set when syncing/creating).
- Workflow only manages virtual cards.

## ID Semantics

- `userId`: app user id.
- `externalId` in `striga_user`: Striga cloud user id.
- `account.accountId` (for Striga provider): Striga wallet id.
- `striga_card.externalId`: Striga card id.

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
3. Emit `kyc:tier:update`; handlers may trigger wallet/card flows when tier1 becomes `APPROVED`.

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

Card workflow runs **separately** (no nested flows) when:

- Login/create workflows finish and the user already has tier1 `APPROVED`.
- `kyc:tier:update` indicates tier1 transitioned to `APPROVED`.

Rules:

1. If local card rows already exist at login/create, skip creation; still refresh from provider when card flow is invoked.
2. Use wallet id from local `account.accountId`; if missing, resolve wallet first (see Wallet resolution).
3. Recover provider cards by Striga user id; `externalId` must be stored on local cards for lookups.
4. Filter wallet sub-accounts using `STRIGA_CARD_ASSET_NAMES` (default `EUR`) before creating new virtual cards.
5. New cards are virtual, `nameOnCard = "Vero Vault"`, password from `STRIGA_CARD_DEFAULT_PASSWORD`.
6. Currency strings are normalized through `normalizeSupportedCurrency` (`src/providers/striga/helpers/striga-currency.helper.ts`).
7. Request-scoped “me” services receive `req` and use `req.user.id` directly.

Main code:

- `src/providers/striga/services/striga-card-workflow.service.ts`
- `src/providers/striga/striga-cards/striga-cards.service.ts`
- `src/providers/striga/striga-cards/striga-cards.controller.ts` (endpoints under `/api/v1/striga/cards`)

Repository support:

- `findByExternalId`, `findByStrigaUserWithFilters` in `striga-card.repository.ts`.

Config:

- `STRIGA_CARD_ASSET_NAMES` (default `EUR`)
- `STRIGA_CARD_DEFAULT_PASSWORD` (default `VeroVault123!`)

## How To Extend Safely

If you add new Striga features:

- Keep wallet-first mapping intact (`account.accountId = walletId`).
- Never map local `account.accountId` to Striga currency sub-account id.
- Reuse wallet helper for payload parsing and wallet selection.
- Reuse `normalizeSupportedCurrency` helper to validate/upper-case asset names.
- Keep workflow orchestration in `striga-user-workflow.service.ts`.
- Keep provider calls in Striga services, not in handlers/controllers.

## Quick Debug Checklist

If local wallet is missing after tier1 approval:

1. Check `STRIGA_WEBHOOK_KYC_EVENT` is consumed.
2. Check local `striga_user.externalId` exists.
3. Check wallet calls order: `/wallets/get/account` -> `/wallets/get` -> `/wallets/get/all`.
4. Check selected wallet id is written to local `account.accountId`.
5. For card issues, confirm requested currency is in `STRIGA_SUPPORTED_CARD_ASSET_NAMES`; DTO validation will reject others.
