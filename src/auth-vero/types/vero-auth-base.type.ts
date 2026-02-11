import type { SocialInterface } from '../../social/interfaces/social.interface';
import type { Session } from '../../session/domain/session';
import type { User } from '../../users/domain/user';

export type VeroTokenCacheEntry = {
  internalUserId: User['id'];
  veroIdentity: {
    socialId?: string;
    email?: string | null;
  };
  sessionId?: Session['id'];
  expiresAt: number;
};

export type VeroProfileResult = {
  profile: SocialInterface;
  exp?: number;
  rawProfile: any;
};
