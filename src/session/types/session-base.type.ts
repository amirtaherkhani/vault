import type { Request as ExpressRequest } from 'express';

export type SessionMetadata = {
  deviceName?: string | null;
  deviceType?: string | null;
  appVersion?: string | null;
  country?: string | null;
  city?: string | null;
};

export type SessionUser = {
  id?: number | string;
  sessionId?: number | string;
  hash?: string;
};

export type SessionRequest = ExpressRequest & {
  user?: SessionUser;
};
