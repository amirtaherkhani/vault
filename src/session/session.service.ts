import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { SessionRepository } from './infrastructure/persistence/session.repository';
import { Session } from './domain/session';
import { User } from '../users/domain/user';
import { NullableType } from '../utils/types/nullable.type';
import { SessionMetadata, SessionUser } from './types/session-base.type';
import { SessionDto } from './dto/session.dto';

@Injectable()
export class SessionService {
  private readonly maxSessionsPerUser: number;
  private readonly activeWithinDaysDefault: number | null;

  constructor(private readonly sessionRepository: SessionRepository) {
    this.maxSessionsPerUser = this.resolveMaxSessionsPerUser();
    this.activeWithinDaysDefault = this.resolveActiveWithinDaysDefault();
  }

  private resolveMaxSessionsPerUser(): number {
    const raw = process.env.SESSION_MAX_PER_USER;
    if (!raw) {
      return 10;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 10;
    }
    return Math.floor(parsed);
  }

  private resolveActiveWithinDaysDefault(): number | null {
    const raw = process.env.SESSION_ACTIVE_WITHIN_DAYS;
    if (raw === undefined || raw === null || raw === '') {
      return 30;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }

  private resolveActiveWithinDaysOverride(
    activeWithinDays?: string | number,
  ): number | null {
    if (activeWithinDays === undefined || activeWithinDays === null) {
      return this.activeWithinDaysDefault;
    }
    if (
      typeof activeWithinDays === 'string' &&
      activeWithinDays.toLowerCase() === 'all'
    ) {
      return null;
    }
    const parsed =
      typeof activeWithinDays === 'number'
        ? activeWithinDays
        : Number(activeWithinDays);
    if (!Number.isFinite(parsed)) {
      return this.activeWithinDaysDefault;
    }
    if (parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }

  findById(id: Session['id']): Promise<NullableType<Session>> {
    return this.sessionRepository.findById(id);
  }

  findByUserId(conditions: { userId: User['id'] }): Promise<Session[]> {
    return this.sessionRepository.findByUserId(conditions);
  }

  async listForUser(user: SessionUser | undefined): Promise<SessionDto[]> {
    if (!user?.id) {
      throw new UnauthorizedException();
    }
    const sessions = await this.findByUserId({ userId: user.id });
    return sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName ?? null,
      deviceType: session.deviceType ?? null,
      appVersion: session.appVersion ?? null,
      country: session.country ?? null,
      city: session.city ?? null,
      lastUsedAt: session.lastUsedAt ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      current:
        user.sessionId !== undefined &&
        String(user.sessionId) === String(session.id),
    }));
  }

  async listForUserWithActivityFilter(
    user: SessionUser | undefined,
    activeWithinDays?: string | number,
  ): Promise<SessionDto[]> {
    const sessions = await this.listForUser(user);
    const days = this.resolveActiveWithinDaysOverride(activeWithinDays);
    if (!days || days <= 0) {
      return sessions;
    }
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    return sessions.filter((session) => {
      const lastUsedAt =
        session.lastUsedAt ?? session.updatedAt ?? session.createdAt;
      return lastUsedAt && lastUsedAt.getTime() >= threshold;
    });
  }

  async deleteOneForUser(
    user: SessionUser | undefined,
    id: Session['id'],
  ): Promise<void> {
    if (!user?.id) {
      throw new UnauthorizedException();
    }
    const session = await this.findById(id);
    if (!session || String(session.user?.id) !== String(user.id)) {
      throw new NotFoundException('Session not found');
    }
    await this.deleteById(session.id);
  }

  async deleteAllForUser(
    user: SessionUser | undefined,
    includeCurrent?: string | boolean,
  ): Promise<void> {
    if (!user?.id) {
      throw new UnauthorizedException();
    }
    const shouldIncludeCurrent =
      includeCurrent === true || includeCurrent === 'true';
    if (shouldIncludeCurrent || !user.sessionId) {
      await this.deleteByUserId({ userId: user.id });
      return;
    }
    await this.deleteByUserIdWithExclude({
      userId: user.id,
      excludeSessionId: user.sessionId,
    });
  }

  create(
    data: Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>,
    metadata?: SessionMetadata,
  ): Promise<Session> {
    return this.sessionRepository
      .create({
        ...data,
        ...metadata,
      })
      .then(async (created) => {
        await this.enforceMaxSessionsForUser(created.user?.id, created.id);
        return created;
      });
  }

  private async enforceMaxSessionsForUser(
    userId: User['id'] | undefined,
    keepSessionId?: Session['id'],
  ): Promise<void> {
    if (!userId) {
      return;
    }
    if (!this.maxSessionsPerUser) {
      return;
    }
    const sessions = await this.findByUserId({ userId });
    if (sessions.length <= this.maxSessionsPerUser) {
      return;
    }

    const ordered = [...sessions].sort((a, b) => {
      const aTime = (a.lastUsedAt ?? a.updatedAt ?? a.createdAt).getTime();
      const bTime = (b.lastUsedAt ?? b.updatedAt ?? b.createdAt).getTime();
      return bTime - aTime;
    });

    const keepIds = new Set(
      ordered.slice(0, this.maxSessionsPerUser).map((session) => session.id),
    );
    if (keepSessionId) {
      keepIds.add(keepSessionId);
    }

    const toDelete = ordered.filter((session) => !keepIds.has(session.id));
    for (const session of toDelete) {
      await this.deleteById(session.id);
    }
  }

  update(
    id: Session['id'],
    payload: Partial<
      Omit<Session, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
    >,
  ): Promise<Session | null> {
    return this.sessionRepository.update(id, payload);
  }

  deleteById(id: Session['id']): Promise<void> {
    return this.sessionRepository.deleteById(id);
  }

  deleteByUserId(conditions: { userId: User['id'] }): Promise<void> {
    return this.sessionRepository.deleteByUserId(conditions);
  }

  deleteByUserIdWithExclude(conditions: {
    userId: User['id'];
    excludeSessionId: Session['id'];
  }): Promise<void> {
    return this.sessionRepository.deleteByUserIdWithExclude(conditions);
  }
}
