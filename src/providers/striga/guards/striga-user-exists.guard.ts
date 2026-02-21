import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../../users/users.service';
import {
  STRIGA_REQUIRE_KYC_APPROVED_KEY,
  STRIGA_REQUIRE_USER_KEY,
} from '../decorators/striga-access.decorator';
import { StrigaUsersService } from '../striga-users/striga-users.service';
import { StrigaRequestWithContext } from '../types/striga-request-context.type';

@Injectable()
export class StrigaUserExistsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly strigaUsersService: StrigaUsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireStrigaUser =
      this.reflector.getAllAndOverride<boolean>(STRIGA_REQUIRE_USER_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const requireKycApproved =
      this.reflector.getAllAndOverride<boolean>(
        STRIGA_REQUIRE_KYC_APPROVED_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? false;

    if (!requireStrigaUser && !requireKycApproved) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<StrigaRequestWithContext>();
    const authUserId = request.user?.id;
    if (typeof authUserId === 'undefined' || authUserId === null) {
      throw new UnauthorizedException('Authenticated user is required.');
    }

    const appUser = await this.usersService.findById(authUserId);
    if (!appUser) {
      throw new NotFoundException('Current user not found.');
    }

    const email = String(appUser.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      throw new ForbiddenException(
        'Current user email is required for Striga access.',
      );
    }

    const strigaUser = await this.strigaUsersService.findByEmail(email);
    if (!strigaUser) {
      throw new NotFoundException(
        'Striga user for current user was not found in local database.',
      );
    }

    request.striga = {
      appUser,
      strigaUser,
    };

    return true;
  }
}
