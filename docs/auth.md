# Auth

## Table of Contents <!-- omit in toc -->

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Endpoints Summary](#endpoints-summary)
- [Configure Auth](#configure-auth)
- [Email Auth](#email-auth)
- [Google Auth](#google-auth)
- [Apple Auth](#apple-auth)
- [Vero Auth](#vero-auth)
- [Protected APIs And Guards](#protected-apis-and-guards)
- [Refresh Token Flow](#refresh-token-flow)
- [Logout Behavior](#logout-behavior)
- [Session Storage](#session-storage)
- [Troubleshooting](#troubleshooting)

---

## Overview

This project supports these login flows:

1. Email/password
2. Google
3. Apple
4. Vero

The API has two token styles:

1. Internal app JWT flow (used by email, google, apple, and vero internal mode)
2. External Vero token flow (returns and accepts the same Vero token)

Default base path for endpoints in this doc: `/api/v1`.

## Core Concepts

- Access token: token sent to protected APIs in `Authorization: Bearer <token>`.
- Refresh token: used to rotate access token in internal JWT flow.
- Session: DB record representing one logged-in device/app context.
- Session hash: value bound to refresh token to support rotation and invalidation.

Important behavior:

- Internal JWT login creates a session.
- Vero external-token login does not create a session.
- Logout removes (soft-deletes) the current session row.
- Access JWTs are stateless and can remain valid until expiry even after logout.

## Endpoints Summary

| Flow | Endpoint | Request body | Token returned | Session created | Refresh token |
| --- | --- | --- | --- | --- | --- |
| Email | `POST /auth/email/login` | `{ email, password }` | Internal JWT | Yes | Yes |
| Google | `POST /auth/google/login` | `{ idToken }` | Internal JWT | Yes | Yes |
| Apple | `POST /auth/apple/login` | `{ idToken, firstName?, lastName? }` | Internal JWT | Yes | Yes |
| Vero internal mode | `POST /auth/vero/login` | `{ veroToken }` | Internal JWT | Yes | Yes |
| Vero external mode | `POST /auth/vero/login` | `{ veroToken }` | Same Vero token | No | No (`""`) |

## Configure Auth

Set core JWT secrets/expirations in `.env`:

```text
AUTH_JWT_SECRET=...
AUTH_JWT_TOKEN_EXPIRES_IN=15m
AUTH_REFRESH_SECRET=...
AUTH_REFRESH_TOKEN_EXPIRES_IN=3650d
AUTH_FORGOT_SECRET=...
AUTH_FORGOT_TOKEN_EXPIRES_IN=30m
AUTH_CONFIRM_EMAIL_SECRET=...
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d
```

Generate strong random secrets:

```bash
node -e "console.log('\nAUTH_JWT_SECRET=' + require('crypto').randomBytes(256).toString('base64') + '\n\nAUTH_REFRESH_SECRET=' + require('crypto').randomBytes(256).toString('base64') + '\n\nAUTH_FORGOT_SECRET=' + require('crypto').randomBytes(256).toString('base64') + '\n\nAUTH_CONFIRM_EMAIL_SECRET=' + require('crypto').randomBytes(256).toString('base64'));"
```

## Email Auth

### Login

- Endpoint: `POST /auth/email/login`
- Body:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Behavior

1. Validates email/password.
2. Creates session row in DB.
3. Returns `token`, `refreshToken`, `tokenExpires`, `user`.

## Google Auth

### Setup

Set:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Login

- Endpoint: `POST /auth/google/login`
- Body:

```json
{
  "idToken": "google-id-token"
}
```

### Behavior

1. Verifies Google ID token.
2. Resolves/creates user (`provider=google`, `socialId=sub`).
3. Creates session row.
4. Returns internal JWT + refresh token.

## Apple Auth

### Setup

Set:

```text
APPLE_APP_AUDIENCE=["com.company", "com.company.web"]
```

### Login

- Endpoint: `POST /auth/apple/login`
- Body:

```json
{
  "idToken": "apple-id-token",
  "firstName": "Optional",
  "lastName": "Optional"
}
```

### Behavior

1. Verifies Apple ID token.
2. Resolves/creates user (`provider=apple`, `socialId=sub`).
3. Creates session row.
4. Returns internal JWT + refresh token.

## Vero Auth

Vero has two distinct modes.

### 1) Internal mode

Condition:

```text
AUTH_VERO_USE_EXTERNAL_TOKEN=false
```

Behavior:

1. `POST /auth/vero/login` with `veroToken`.
2. Validate Vero token and map profile.
3. Resolve/create user (`provider=vero`, `socialId` based identity mapping).
4. Create session row.
5. Return internal JWT + refresh token.

Expiry note:

- Initial internal access token tries to align with incoming Vero token `exp` when available.
- Session row itself does not have a dedicated expiry column.

### 2) External mode

Condition:

```text
AUTH_VERO_USE_EXTERNAL_TOKEN=true
```

Behavior:

1. `POST /auth/vero/login` with `veroToken`.
2. Validate token and resolve/create user.
3. Return the same Vero token as `token`.
4. `refreshToken` is empty.
5. No session row is created.

### Vero validation configuration

```text
AUTH_VERO_USE_EXTERNAL_TOKEN=false
VERO_ENABLE_JWKS_VALIDATION=false
VERO_PROFILE_API_BASE_URL=https://gateway.veroapi.com/veritas
VERO_JWKS_URI=https://gateway.veroapi.com/veritas/jwks
VERO_JWKS_CACHE_MAX_AGE_MS=900000
```

Variable roles:

- `AUTH_VERO_USE_EXTERNAL_TOKEN`: controls whether external mode is enabled.
- `VERO_ENABLE_JWKS_VALIDATION`: chooses validation path for Vero token checks.
- `VERO_JWKS_URI`: JWKS endpoint for local RS256 verification.
- `VERO_JWKS_CACHE_MAX_AGE_MS`: JWKS cache max age config.
- `VERO_PROFILE_API_BASE_URL`: base URL for profile validation path (`/me/profile`).

Validation path:

- `VERO_ENABLE_JWKS_VALIDATION=true`: validate via JWKS.
- `VERO_ENABLE_JWKS_VALIDATION=false`: validate via `GET /me/profile`.

More details: `docs/providers/vero-provider.md`.

## Protected APIs And Guards

Most protected endpoints use dynamic auth guard behavior:

- `AUTH_VERO_USE_EXTERNAL_TOKEN=false`:
  - Accept internal JWT only.
- `AUTH_VERO_USE_EXTERNAL_TOKEN=true`:
  - Accept internal JWT or Vero bearer token.

`/auth/me`, `/auth/logout`, `/auth/update`, and many feature controllers use this behavior.

## Refresh Token Flow

Internal JWT flows only.

1. Login returns `token`, `refreshToken`, `tokenExpires`.
2. Use access token for regular API calls.
3. When expired, call:

```text
POST /auth/refresh
Authorization: Bearer <refreshToken>
```

Refresh checks:

1. Session exists.
2. Session hash matches refresh payload hash.
3. Hash rotates after successful refresh.

## Logout Behavior

Call:

```text
POST /auth/logout
Authorization: Bearer <accessToken>
```

What happens:

1. Current session id is read from token payload.
2. Session is soft-deleted in DB.
3. Refresh flow for that session stops working.

Use session APIs for other devices only (`DELETE /sessions/:id`, `DELETE /sessions`).

What does not happen:

- Existing access JWT is not instantly revoked. It remains valid until `exp`.

In external Vero mode, logout is not a primary revocation control because no session is created in that mode.

## Session Storage

Sessions are handled by the relational database (`session` table, soft delete), not Redis.

Redis is used in this project for other concerns (for example cache, internal events, socket adapters), and optionally for Vero token-to-user cache when cache is enabled.

Session APIs and device metadata details: `docs/sessions.md`.

## Troubleshooting

### Token still works for a short time after logout

Expected for stateless JWT access tokens. This is normal unless you add per-request DB session checks for access tokens.

### Vero external mode returns internal JWT

Check:

```text
AUTH_VERO_USE_EXTERNAL_TOKEN=true
```

### Vero bearer token rejected on protected APIs

Check:

1. `AUTH_VERO_USE_EXTERNAL_TOKEN=true`
2. Token is valid and not expired.
3. Vero validation path config (`VERO_ENABLE_JWKS_VALIDATION`, `VERO_JWKS_URI`, `VERO_PROFILE_API_BASE_URL`) is correct.

---

Previous: [Database](database.md)

Next: [Serialization](serialization.md)
