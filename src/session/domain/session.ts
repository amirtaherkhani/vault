import { User } from '../../users/domain/user';

export class Session {
  id: number | string;
  user: User;
  hash: string;
  deviceName?: string | null;
  deviceType?: string | null;
  appVersion?: string | null;
  country?: string | null;
  city?: string | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}
