# Sessions

This document explains how sessions work in the app, how the server manages them, and how a client should use the Sessions APIs.

**Overview**

Sessions are created whenever a user logs in (email/password or social login, including Vero). Each session represents a distinct device/app instance. You can list sessions, close a specific session, or close all sessions. Sessions are also used to support refresh tokens in internal JWT mode.

**Key Concepts**

- Each login creates a new session row.
- Sessions are stored in the `session` table.
- Each session is linked to a user.
- Sessions have metadata fields for device tracking.
- Session activity is updated on every authenticated request via middleware.

**Session Metadata**

The following metadata is supported and is captured from request headers:

- `deviceName`
- `deviceType`
- `appVersion`
- `country`
- `city`

Headers expected from clients:

```
x-device-name
x-device-type
x-app-version
x-country
x-city
```

**How Metadata Is Stored**

- On login: the session is created with the metadata from headers.
- On every authenticated request: middleware updates `lastUsedAt` and refreshes metadata if headers are present.

**Authentication Modes**

Both internal JWT mode and Vero external-token mode create sessions.

- Internal JWT mode: sessions + refresh tokens.
- Vero external-token mode: sessions + no refresh token.

**API Reference**

All endpoints are under `/api/v1`.

**List Sessions**

```
GET /api/v1/sessions?activeWithinDays=30
Authorization: Bearer <token>
```

Response:

```json
[
  {
    "id": 10,
    "deviceName": "iPhone 15",
    "deviceType": "ios",
    "appVersion": "1.4.2",
    "country": "US",
    "city": "San Francisco",
    "lastUsedAt": "2026-02-11T11:10:00.000Z",
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T11:10:00.000Z",
    "current": true
  }
]
```

**Close One Session**

```
DELETE /api/v1/sessions/:id
Authorization: Bearer <token>
```

Returns `204 No Content` if the session exists and belongs to the user.

**Close All Sessions**

```
DELETE /api/v1/sessions?includeCurrent=false
Authorization: Bearer <token>
```

- `includeCurrent=false` (default) keeps the current session open.
- `includeCurrent=true` closes all sessions including the current one.

Returns `204 No Content`.

**Active Sessions Filter**

By default, the list endpoint returns sessions that have been used within the last `30` days. You can override this behavior with `activeWithinDays`:

```
GET /api/v1/sessions?activeWithinDays=7
```

The filter checks `lastUsedAt` first, then falls back to `updatedAt` or `createdAt`.

You can change the default window with `SESSION_ACTIVE_WITHIN_DAYS` (set to `0` to disable the default filter).

To return all sessions for a request, pass `activeWithinDays=all` or `activeWithinDays=0`.

**Renew Session (Internal JWT only)**

```
POST /api/v1/sessions/refresh
Authorization: Bearer <refresh token>
```

Returns a new JWT + refresh token.

This endpoint requires the refresh token (internal JWT flow).
It does not apply to Vero tokens.

**Client Usage Pattern (Telegram-style)**

1. Include device headers on login:

```
x-device-name: iPhone 15
x-device-type: ios
x-app-version: 1.4.2
x-country: IR
x-city: Tehran
```

2. Use the access token returned by login.
3. Call `GET /api/v1/sessions` to list active sessions.
4. Show the list to the user.
5. Let the user close a session by calling `DELETE /api/v1/sessions/:id`.

**Notes**

- The session list is scoped to the authenticated user.
- You cannot delete sessions owned by other users.
- Session activity updates require an authenticated request and a valid `sessionId` in the token.
- You can limit the maximum number of sessions per user with `SESSION_MAX_PER_USER` (default is `10`).
- You can control the default active sessions window with `SESSION_ACTIVE_WITHIN_DAYS` (default is `30` days).
