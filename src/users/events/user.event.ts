import { AuthProvidersEnum } from '../../auth/auth-providers.enum';
import { InternalEventBase } from '../../common/internal-events/base/internal-event.abstract';
import { User } from '../domain/user';
import { UserEventDto } from '../dto/user.dto';

import {
  VERO_LOGIN_USER_ADDED_EVENT,
  VERO_LOGIN_USER_DELETED_EVENT,
  VERO_LOGIN_USER_LOGGED_IN_EVENT,
} from '../types/user-event.type';

export class UserInternalEvent extends InternalEventBase<UserEventDto> {
  private constructor(eventType: string, payload: UserEventDto) {
    super(eventType, payload);
  }

  static created(user: User): UserInternalEvent | null {
    const eventType = this.resolveEventType(user.provider, 'created');
    if (!eventType) {
      return null;
    }

    return new UserInternalEvent(eventType, this.buildPayload(user));
  }

  static deleted(user: User): UserInternalEvent | null {
    const eventType = this.resolveEventType(user.provider, 'deleted');
    if (!eventType) {
      return null;
    }

    const payload = this.buildPayload(user);
    return new UserInternalEvent(
      eventType,
      new UserEventDto({
        ...payload,
        deletedAt: new Date().toISOString(),
      }),
    );
  }

  static loggedIn(user: User): UserInternalEvent | null {
    const eventType = this.resolveEventType(user.provider, 'loggedIn');
    if (!eventType) {
      return null;
    }

    return new UserInternalEvent(eventType, this.buildPayload(user));
  }

  private static resolveEventType(
    provider: User['provider'],
    action: 'created' | 'deleted' | 'loggedIn',
  ): string | null {
    if (provider === AuthProvidersEnum.vero) {
      if (action === 'created') {
        return VERO_LOGIN_USER_ADDED_EVENT;
      }

      if (action === 'deleted') {
        return VERO_LOGIN_USER_DELETED_EVENT;
      }

      return VERO_LOGIN_USER_LOGGED_IN_EVENT;
    }

    return null;
  }

  private static buildPayload(user: User): UserEventDto {
    return new UserEventDto({
      userId: String(user.id),
      email: user.email ?? undefined,
      socialId: user.socialId ?? undefined,
      provider: user.provider,
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
    });
  }
}
