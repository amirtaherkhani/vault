# Striga Client Guide (API Usage)

Use this doc to integrate the app’s Striga APIs. It lists only “me” endpoints that client apps should call (they rely on the JWT and do not accept user ids). Admin endpoints are for back-office and are not covered here.
Swagger UI is available at `https://<server-domain>/docs` (replace `<server-domain>` with your API host) and locally at `http://localhost:3000/docs/swagger`.
Scalar docs (interactive) and Swagger docs both show full request/response shapes; use them for online testing.

This is for client developers who call our Striga APIs. It explains what to call, what happens in the background, and how to read card/KYC state.

## Prerequisites

- User is authenticated (JWT) and `striga.enable` feature toggle is on.
- Striga user record is created/linked automatically during login/add flows; most endpoints require that.
- Vero login endpoint is the entry point: it logs the user into the app **and** fires the Striga workflow (creates/recovers Striga user, primary wallet, and card after tier1 approval). No extra client calls are needed to kick off Striga; just log in via Vero.

## Auth Vero Login (critical entry point)

- Endpoint: `POST /api/v1/auth/vero/login` (Swagger: `http://localhost:3000/docs/swagger#/Auth/post_api_v1_auth_vero_login`).
- Body: `{ "veroToken": "<jwt-from-vero>" }` (the same base Vero token you already have in the app).
- Response: app `token`, `refreshToken`, `tokenExpires`, and `user`. Keep using these for later “me” calls; your base Vero token itself does not change.
- Call this **only** when the user signs in (or after logout). Do **not** loop-call it for short TTL refresh; it triggers heavy Striga workflows (user/wallet/card sync). Use the normal app refresh token flow for renewals.
- API docs: `https://<server-domain>/docs#/Auth/post_api_v1_auth_vero_login` or locally `http://localhost:3000/docs/swagger#/Auth/post_api_v1_auth_vero_login`.

## Client Steps (happy path)

1) **Call Vero login (once per app login)**  
   - Use the existing Vero base token; no special token is needed for Striga.  
   - Call `vero-login` only when the user signs in/out, not on token refresh.  
   - After the call, backend workflows run asynchronously: check/create Striga user, fetch KYC status, recover/create primary wallet, account, and (after tier1 approval) the first virtual card.

2) **Check KYC status**  
   - `GET /api/v1/users/me/kyc/status`.  
   - Branch:  
     - If tier1 is `APPROVED` → you can read cards, accounts, and statements.  
     - If not approved → proceed to KYC/start + update contact/profile data.

3) **If KYC is not approved**  
 - Update user info (phone/address/DOB) with `PATCH /api/v1/users/me`.  
 - Start KYC: `POST /api/v1/users/me/kyc/start` to get the SumSub token; launch SDK on client.  
 - Poll status via `GET /users/me/kyc/status`. Webhooks keep backend fresh.

4) **Cards**  
 - Card creation is automatic when tier1 becomes `APPROVED`; backend recovers/creates the first virtual card.  
 - If card already exists, read via `GET /striga/cards/me` or currency/id routes.  
 - If no card appears after tier1 approval and a short delay, retry reading; backend will create/recover automatically.

## ME API Call Sheet (order of use)

1) **Login**  
   - `POST /api/v1/auth/vero/login` (outside this doc): use Vero base token; triggers Striga workflows.

2) **Contact verification (optional but typical before KYC)**  
   - Email verify/resend: `POST /api/v1/users/me/email/verify`, `POST /api/v1/users/me/email/resend`  
   - Mobile verify/resend: `POST /api/v1/users/mobile/verify`, `POST /api/v1/users/mobile/resend`

3) **Profile upkeep before KYC**  
   - Update phone/address/DOB: `PATCH /api/v1/users/me`

4) **Check KYC status**  
   - `GET /api/v1/users/me/kyc/status`

5) **Start KYC (get SDK token) if not approved**  
   - `POST /api/v1/users/me/kyc/start` → returns SumSub token/urls for SDK

6) **Poll KYC**  
 - `GET /api/v1/users/me/kyc/status` until tier1 = `APPROVED`

7) **Cards (after tier1 approved)**  
 - List/read: `GET /api/v1/striga/cards/me`, `GET /api/v1/striga/cards/me/currency/:currency`, `GET /api/v1/striga/cards/me/:id`, `GET /api/v1/striga/cards/me/:id/account`  
   - PIN: `POST /api/v1/striga/cards/me/settings/pin`  
   - Security toggles: `PATCH /api/v1/striga/cards/me/settings/security`  
   - Limits: `PATCH /api/v1/striga/cards/me/settings/limits` and reset endpoints  
   - Freeze/unfreeze: `POST /api/v1/striga/cards/me/settings/freeze`, state via `GET /api/v1/striga/cards/me/:id/freeze`

8) **Transactions**  
 - Account statements: `POST /api/v1/striga/transactions/accounts/me` (by account), `.../asset` (by currency)  
 - Card statements: `POST /api/v1/striga/transactions/cards/me`

### If KYC is already approved

- You can skip contact re-verification, profile updates, and `start KYC`. Go straight to:
  - `GET /api/v1/users/me/kyc/status` to confirm approval
  - card reads/settings (`/striga/cards/me...`)
  - statements (`/striga/transactions/...`)
  - optional PIN/security/limits adjustments on existing cards
     - purchases: `.../reset/purchases`  
     - per-transaction: `.../reset/transactions`
   - Freeze/unfreeze: `POST /api/v1/striga/cards/me/settings/freeze` (toggle) and `GET /api/v1/striga/cards/me/:id/freeze` (state).

8) **Transactions**  
 - Account statements:  
    - by account id: `POST /api/v1/striga/transactions/accounts/me`  
    - by asset: `POST /api/v1/striga/transactions/accounts/me/asset`
 - Card statements: `POST /api/v1/striga/transactions/cards/me`.

## Admin vs Me

- Admin endpoints exist for most operations (update user, start KYC, card settings, statements). For client apps, stick to the `.../me` variants; they derive user id from JWT and enforce guards.

## Tips for Client Developers

- Always present KYC status from `GET /users/me/kyc/status`; rely on webhook-driven freshness.
- Do not build your own card creation flow; just read cards after tier1 approval.
- Cache SumSub tokens only per session; refresh via `start KYC` when expired.
- Handle `409/422` gracefully (e.g., calling start KYC twice). Most endpoints are idempotent on server side.

## What “ME” Means

- “Me” endpoints always take the authenticated user from the JWT (`req.user`) and never accept a user id in the body.
- Guards enforce that a Striga user exists (`StrigaUserExistsGuard`) and that the caller has an authenticated role (`RoleEnum.user` or `RoleEnum.admin`).
- Use “me” endpoints for client apps; admin endpoints are for back-office only and expect explicit ids.
- If a request needs a Striga context, it is derived from the logged-in user; no extra headers or ids are required beyond the bearer token.

## What Happens in the Background (simple view)

- After Vero login, the backend checks/creates the Striga user, picks the primary wallet, and, once tier1 is approved, creates or recovers the first virtual card. This is automatic; the “me” APIs simply let you read/update the result.
- Striga KYC webhooks keep the server’s KYC status fresh; polling `GET /users/me/kyc/status` gives the latest snapshot.
- Only one wallet is tracked locally; card/account reads already point to that wallet. You do not need to manage wallet selection on the client.

### Timing notes / warnings

- Striga actions (KYC review, card provisioning, statement availability) are processed in the provider cloud and can take time. Build UI that shows “pending” states and retries instead of assuming instant completion.
- After tier1 approval, card creation/recovery is automatic but not instantaneous; if a card is not returned yet, retry after a short delay.
- Transaction statements may lag behind real-time transactions; always handle empty lists gracefully and allow refresh.

## Do I need account/wallet APIs on the client?

- No creation or management is needed on the client. The backend selects and stores the primary Striga wallet/account automatically during login/workflows.
- Use account endpoints only to read history:
  - `POST /api/v1/striga/transactions/accounts/me` (by account id)
  - `POST /api/v1/striga/transactions/accounts/me/asset` (by currency)

## After everything is OK (data you can read)

- Cards: `GET /api/v1/striga/cards/me` (list), `.../currency/:currency`, `.../:id`, `.../:id/account`
- Card status/freeze: `GET /api/v1/striga/cards/me/:id/freeze`
- Card settings:
  - PIN: `POST /api/v1/striga/cards/me/settings/pin`
  - Security (contactless/online/withdrawal): `PATCH /api/v1/striga/cards/me/settings/security`
  - Limits: `PATCH /api/v1/striga/cards/me/settings/limits`
  - Reset limits: `PATCH /api/v1/striga/cards/me/settings/limits/reset` (and `/reset/withdrawals`, `/reset/purchases`, `/reset/transactions`)
  - Freeze/unfreeze: `POST /api/v1/striga/cards/me/settings/freeze`
- Card statements: `POST /api/v1/striga/transactions/cards/me`
- Account statements: `POST /api/v1/striga/transactions/accounts/me`, `.../asset`
- (If exposed) card balances are part of wallet account data; there is no separate “card balance” endpoint—balances come from wallet/accounts and from card statements.

## Not provided / not needed on client

- Wallet/account creation and selection are backend-managed; client should not try to create or pick wallets.
- Admin endpoints are out of scope for client apps; use only the “me” paths listed here.
- No dedicated card-balance endpoint; use statements or wallet/account data when exposed by backend.
