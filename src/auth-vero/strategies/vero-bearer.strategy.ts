import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { AuthVeroService } from '../auth-vero.service';
import { User } from '../../users/domain/user';

@Injectable()
export class VeroBearerStrategy extends PassportStrategy(
  Strategy,
  'vero-bearer',
) {
  constructor(private readonly authVeroService: AuthVeroService) {
    super();
  }

  async validate(token: string): Promise<User> {
    return this.authVeroService.resolveUserFromExternalToken(token);
  }
}
