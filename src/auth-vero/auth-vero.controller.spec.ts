jest.mock('../auth/auth.service', () => ({
  AuthService: class {},
}));
jest.mock('./auth-vero.service', () => ({
  AuthVeroService: class {},
}));

import { AuthVeroController } from './auth-vero.controller';
import { AuthVeroService } from './auth-vero.service';
import { AuthService } from '../auth/auth.service';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';

describe('AuthVeroController', () => {
  const authService = {
    validateSocialLogin: jest.fn(),
  };
  const authVeroService = {
    isExternalTokenMode: jest.fn(),
    getProfileByToken: jest.fn(),
    loginWithExternalToken: jest.fn(),
  };

  let controller: AuthVeroController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AuthVeroController(
      authService as unknown as AuthService,
      authVeroService as unknown as AuthVeroService,
    );
  });

  it('returns internal JWT flow when external token mode is disabled', async () => {
    authVeroService.isExternalTokenMode.mockReturnValue(false);
    authVeroService.getProfileByToken.mockResolvedValue({
      profile: { id: 'vero-1', email: 'vero@example.com' },
      exp: 456,
    });
    authService.validateSocialLogin.mockResolvedValue({
      token: 'internal',
      refreshToken: 'refresh',
      tokenExpires: 123,
      user: { id: 1 },
    });

    const response = await controller.login({ veroToken: 'vero-token' });

    expect(authVeroService.getProfileByToken).toHaveBeenCalledWith({
      veroToken: 'vero-token',
    });
    expect(authService.validateSocialLogin).toHaveBeenCalledWith(
      AuthProvidersEnum.vero,
      { id: 'vero-1', email: 'vero@example.com' },
      456,
    );
    expect(response.token).toBe('internal');
  });

  it('returns the Vero token verbatim when external token mode is enabled', async () => {
    authVeroService.isExternalTokenMode.mockReturnValue(true);
    authVeroService.loginWithExternalToken.mockResolvedValue({
      token: 'external',
      refreshToken: '',
      tokenExpires: 0,
      user: { id: 1 },
    });

    const response = await controller.login({ veroToken: 'external' });

    expect(authVeroService.loginWithExternalToken).toHaveBeenCalledWith({
      veroToken: 'external',
    });
    expect(response.token).toBe('external');
  });
});
