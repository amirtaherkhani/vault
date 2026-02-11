jest.mock('../users/users.service', () => ({
  UsersService: class {},
}));
jest.mock('../common/cache', () => ({
  CacheService: class {},
}));

import { AuthVeroService } from './auth-vero.service';
import { VeroPayloadMapper } from './infrastructure/persistence/relational/mappers/vero.mapper';
import { User } from '../users/domain/user';

describe('AuthVeroService', () => {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'vero.useExternalToken') {
        return true;
      }
      return undefined;
    }),
  };
  const jwtService = {
    decode: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const usersService = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByVeroId: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  };
  const cacheService = {
    isEnabled: jest.fn().mockReturnValue(false),
    get: jest.fn(),
    set: jest.fn(),
  };

  let service: AuthVeroService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthVeroService(
      configService as any,
      jwtService as any,
      new VeroPayloadMapper(),
      usersService as any,
      cacheService as any,
    );
  });

  it('returns the same token for external login responses', async () => {
    const user = { id: 123 } as User;
    const profile = {
      id: 'vero-123',
      email: 'vero@example.com',
      firstName: 'Vero',
      lastName: 'User',
    };

    jest.spyOn(service, 'getProfileFromExternalToken').mockResolvedValue({
      profile,
      exp: 123,
      rawProfile: { veroUserId: 'vero-123' },
    });
    jest
      .spyOn(service as any, 'resolveUserFromVeroProfile')
      .mockResolvedValue(user);

    const response = await service.loginWithExternalToken({
      veroToken: 'external-token',
    });

    expect(response.token).toBe('external-token');
    expect(response.refreshToken).toBe('');
    expect(response.tokenExpires).toBe(123000);
    expect(response.user).toBe(user);
  });
});
