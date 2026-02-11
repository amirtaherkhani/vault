# Vero Login

This document explains how Vero login works in this project, how tokens are handled, and what each configuration flag changes.

**Overview**

The API supports Vero authentication in two modes:

1. Internal JWT mode. The API validates the Vero token, upserts the user, and issues its own JWT + refresh token.
2. External token mode. The API validates the Vero token, upserts the user, and returns the same Vero token verbatim.

External token mode is enabled when either of these is true:

- `AUTH_VERO_USE_EXTERNAL_TOKEN=true`
- `VERO_ENABLE_DYNAMIC_CACHE=true`

When external token mode is enabled, the API accepts Vero bearer tokens directly on protected endpoints.

**Key Concepts**

- The user is identified by `socialId` plus `provider=vero`.
- The database does not store `veroId`.
- The login response differs by mode.
- The dynamic auth guard allows `jwt` and `vero-bearer` when external token mode is enabled.

**Configuration**

These environment variables control Vero login behavior:

- `AUTH_VERO_USE_EXTERNAL_TOKEN`  
  When true, the API returns the same Vero token and does not create a session.
- `VERO_ENABLE_DYNAMIC_CACHE`  
  When true, external token mode is enabled and JWT verification uses JWKS. It also enables adaptive JWKS cache timing.
- `VERO_API_BASE_URL`  
  Base URL used to fetch `/me/profile` when external token mode is enabled and dynamic cache is off.
- `VERO_JWKS_URL`  
  JWKS endpoint used to verify RS256 tokens when needed.
- `VERO_CACHE_MAX_AGE`  
  JWKS cache max age in milliseconds.

Defaults are defined in `src/auth-vero/config/vero.config.ts`.

**Modes And Outcomes**

**1) Internal JWT Mode**  
Conditions: `AUTH_VERO_USE_EXTERNAL_TOKEN=false` and `VERO_ENABLE_DYNAMIC_CACHE=false`

Behavior:

1. Client sends `POST /api/v1/auth/vero/login` with `veroToken`.
2. Server verifies the token, maps the profile, and upserts the user.
3. Server creates a session and issues a new internal JWT + refresh token.

Result:

- The response token is different from the Vero token.
- A session is created.
- Protected endpoints require the internal JWT.

**2) External Token Mode**  
Conditions: `AUTH_VERO_USE_EXTERNAL_TOKEN=true` or `VERO_ENABLE_DYNAMIC_CACHE=true`

Behavior:

1. Client already has a Vero token.
2. Client may call `POST /api/v1/auth/vero/login` to upsert the user.
3. Server returns the same Vero token verbatim.

Result:

- The response token is the same as the Vero token.
- A session is created for the token (used for logout and tracking).
- Refresh token remains an empty string.
- Protected endpoints accept the Vero token directly.

**Validation Path**

External token mode validates tokens in one of two ways:

- `VERO_ENABLE_DYNAMIC_CACHE=true`  
  The token is verified using JWKS (`VERO_JWKS_URL`), and claims are mapped directly.

- `VERO_ENABLE_DYNAMIC_CACHE=false`  
  The API calls `GET /me/profile` on the Vero gateway (`VERO_API_BASE_URL`) to validate the token and retrieve profile data.

**Dynamic Auth Guard Behavior**

The dynamic guard allows the following:

- External token mode enabled: `jwt` or `vero-bearer` are accepted.
- External token mode disabled: only `jwt` is accepted.

The guard is controlled by `AUTH_VERO_USE_EXTERNAL_TOKEN` and `VERO_ENABLE_DYNAMIC_CACHE`.

**User Matching Rules**

When a Vero profile is received:

1. Try `socialId` + `provider=vero`.
2. Fall back to email match if available.
3. If no user exists, create a new user with `provider=vero` and `socialId` from the Vero identity.

**Request And Response Examples**

**Login Request**

```json
{
  "veroToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Internal JWT Mode Response**

```json
{
  "token": "internal-jwt",
  "refreshToken": "refresh-jwt",
  "tokenExpires": 1770744409000,
  "user": {
    "id": 3,
    "provider": "vero",
    "socialId": "0a7346d0-4611-11ef-8342-6760128cffdb"
  }
}
```

**External Token Mode Response**

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "refreshToken": "",
  "tokenExpires": 1770744409000,
  "user": {
    "id": 3,
    "provider": "vero",
    "socialId": "0a7346d0-4611-11ef-8342-6760128cffdb"
  }
}
```

**Using The Token On Protected Endpoints**

```text
Authorization: Bearer <token>
```

**Caching Notes**

The Vero token-to-user mapping is cached:

- Cache key is a SHA-256 hash of the token.
- TTL uses the token `exp` claim when present.
- If no `exp` is present, a default TTL is used.
- If `CACHE_ENABLE=true`, Redis is used; otherwise an in-memory map is used.

**Troubleshooting**

**The token changes after login**  
You are in internal JWT mode. Set either `AUTH_VERO_USE_EXTERNAL_TOKEN=true` or `VERO_ENABLE_DYNAMIC_CACHE=true`.

**Bearer token is rejected on protected endpoints**  
External token mode is not enabled. Set one of the external flags or use the internal JWT.

**User not found after login**  
Check that the Vero token contains a stable identifier and email, and that the user mapping rules are satisfied.
