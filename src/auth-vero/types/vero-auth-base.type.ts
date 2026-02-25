import type { SocialInterface } from '../../social/interfaces/social.interface';
import type { User } from '../../users/domain/user';

export type VeroTokenCacheEntry = {
  internalUserId: User['id'];
  veroIdentity: {
    socialId?: string;
    email?: string | null;
  };
  expiresAt: number;
};

export type VeroProfileResult = {
  profile: SocialInterface;
  exp?: number;
  rawProfile: any;
};
