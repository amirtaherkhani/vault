function getReadableDuration(msUntilExpiration: number): string {
  const totalSeconds = Math.floor(msUntilExpiration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s later`;
}
import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthUpdateDto } from './dto/auth-update.dto';
import { AuthProvidersEnum } from './auth-providers.enum';
import { SocialInterface } from '../social/interfaces/social.interface';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { GroupPlainToInstance } from '../utils/transformers/class.transformer';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { Session } from '../session/domain/session';
import { SessionService } from '../session/session.service';
import { SessionMetadata } from '../session/types/session-base.type';
import { StatusEnum } from '../statuses/statuses.enum';
import { User } from '../users/domain/user';
import { UNKNOWN_USER_NAME_PLACEHOLDER } from '../users/constants/user.constants';
import { InternalEventsService } from '../common/internal-events/internal-events.service';
import { InternalEventPayload } from '../common/internal-events/types/internal-events.type';
import { UserInternalEvent } from '../users/events/user.event';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
    private internalEventsService: InternalEventsService,
    private dataSource: DataSource,
  ) {}

  async validateLogin(
    loginDto: AuthEmailLoginDto,
    sessionMetadata?: SessionMetadata,
  ): Promise<LoginResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'notFound',
        },
      });
    }

    if (user.provider !== AuthProvidersEnum.email) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: `needLoginViaProvider:${user.provider}`,
        },
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          password: 'incorrectPassword',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create(
      {
        user,
        hash,
        lastUsedAt: new Date(),
      },
      sessionMetadata,
    );

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
    });
    const readable = getReadableDuration(tokenExpires - Date.now());
    this.logger.debug(
      `Email login - userId: ${user.id}, username: ${user.email}, tokenExpires: ${tokenExpires} (${readable})`,
    );
    this.logger.log(`Email login - userId: ${user.id}`);

    const result = {
      refreshToken,
      token,
      tokenExpires,
      user,
    };

    return GroupPlainToInstance(LoginResponseDto, result, [RoleEnum.user]);
  }

  async validateSocialLogin(
    authProvider: string,
    socialData: SocialInterface,
    externalExp?: number,
    sessionMetadata?: SessionMetadata,
  ): Promise<LoginResponseDto> {
    let user: NullableType<User> = null;
    const socialEmail = socialData.email?.toLowerCase();
    let userByEmail: NullableType<User> = null;

    if (socialEmail) {
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialData.id) {
      user = await this.usersService.findBySocialIdAndProvider({
        socialId: socialData.id,
        provider: authProvider,
      });
    }

    if (user) {
      const updates: Partial<User> = {};
      const emailBelongsToAnotherUser =
        userByEmail && userByEmail.id !== user.id;

      if (
        socialEmail &&
        !emailBelongsToAnotherUser &&
        user.email?.toLowerCase() !== socialEmail
      ) {
        updates.email = socialEmail;
      }

      const firstNameUpdate = this.resolveNameUpdate(
        user.firstName,
        socialData.firstName,
      );
      const lastNameUpdate = this.resolveNameUpdate(
        user.lastName,
        socialData.lastName,
      );

      if (firstNameUpdate) {
        updates.firstName = firstNameUpdate;
      }
      if (lastNameUpdate) {
        updates.lastName = lastNameUpdate;
      }

      if (Object.keys(updates).length) {
        await this.usersService.update(user.id, {
          ...updates,
          provider: user.provider ?? authProvider,
          socialId: user.socialId,
        });
        user = await this.usersService.findById(user.id);
      }
    } else if (userByEmail) {
      user = userByEmail;
    } else if (socialData.id) {
      const role = {
        id: RoleEnum.user,
      };
      const status = {
        id: StatusEnum.active,
      };

      user = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: this.normalizeNameValue(socialData.firstName) ?? null,
        lastName: this.normalizeNameValue(socialData.lastName) ?? null,
        socialId: socialData.id,
        provider: authProvider,
        role,
        status,
      });

      user = await this.usersService.findById(user.id);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create(
      {
        user,
        hash,
        lastUsedAt: new Date(),
      },
      sessionMetadata,
    );

    const {
      token: jwtToken,
      refreshToken,
      tokenExpires,
    } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
      externalExp,
    });
    const readable = getReadableDuration(tokenExpires - Date.now());
    this.logger.debug(
      `Social login [${authProvider.toUpperCase()}] - userId: ${user.id}, username: ${user.email}, tokenExpires: ${tokenExpires} (${readable})`,
    );
    this.logger.log(
      `Social login [${authProvider.toUpperCase()}] - userId: ${user.id}`,
    );

    const result = {
      refreshToken,
      token: jwtToken,
      tokenExpires,
      user,
    };

    await this.emitVeroLoggedInEvent(user, authProvider);

    return GroupPlainToInstance(LoginResponseDto, result, [RoleEnum.user]);
  }

  private async emitVeroLoggedInEvent(
    user: User,
    authProvider: string,
  ): Promise<void> {
    if (authProvider !== AuthProvidersEnum.vero) {
      return;
    }

    const event = UserInternalEvent.loggedIn(user);
    if (!event) {
      return;
    }

    try {
      await this.internalEventsService.emit(this.dataSource.manager, {
        eventType: event.eventType,
        payload: { ...event.payload } as InternalEventPayload,
      });
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      if (message.includes('Internal events are disabled')) {
        this.logger.warn(
          `Internal events are disabled; skipping emit for: ${event.eventType}`,
        );
        return;
      }
      this.logger.error(
        `Failed to emit internal event ${event.eventType}: ${message}`,
      );
      throw error;
    }
  }

  private normalizeNameValue(value?: string | null): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim();

    return normalized ? normalized : undefined;
  }

  private resolveNameUpdate(
    current: string | null,
    incoming?: string | null,
  ): string | undefined {
    const normalizedIncoming = this.normalizeNameValue(incoming);
    if (!normalizedIncoming) {
      return undefined;
    }

    const incomingLower = normalizedIncoming.toLowerCase();
    const normalizedCurrent =
      this.normalizeNameValue(current)?.toLowerCase() ?? '';
    const isCurrentUnknown =
      !normalizedCurrent ||
      normalizedCurrent === UNKNOWN_USER_NAME_PLACEHOLDER.toLowerCase();

    if (incomingLower === UNKNOWN_USER_NAME_PLACEHOLDER.toLowerCase()) {
      return undefined;
    }

    if (isCurrentUnknown || normalizedCurrent !== incomingLower) {
      return normalizedIncoming;
    }

    return undefined;
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.user,
      },
      status: {
        id: StatusEnum.inactive,
      },
    });

    const hash = await this.jwtService.signAsync(
      {
        confirmEmailUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );

    await this.mailService.userSignUp({
      to: dto.email,
      data: {
        hash,
      },
    });
  }

  async confirmEmail(hash: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (
      !user ||
      user?.status?.id?.toString() !== StatusEnum.inactive.toString()
    ) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    user.status = {
      id: StatusEnum.active,
    };

    await this.usersService.update(user.id, user);
  }

  async confirmNewEmail(hash: string): Promise<void> {
    let userId: User['id'];
    let newEmail: User['email'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        confirmEmailUserId: User['id'];
        newEmail: User['email'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });

      userId = jwtData.confirmEmailUserId;
      newEmail = jwtData.newEmail;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        error: `notFound`,
      });
    }

    user.email = newEmail;
    user.status = {
      id: StatusEnum.active,
    };

    await this.usersService.update(user.id, user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          email: 'emailNotExists',
        },
      });
    }

    const tokenExpiresIn = this.configService.getOrThrow('auth.forgotExpires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const hash = await this.jwtService.signAsync(
      {
        forgotUserId: user.id,
      },
      {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
        expiresIn: tokenExpiresIn,
      },
    );

    await this.mailService.forgotPassword({
      to: email,
      data: {
        hash,
        tokenExpires,
      },
    });
  }

  async resetPassword(hash: string, password: string): Promise<void> {
    let userId: User['id'];

    try {
      const jwtData = await this.jwtService.verifyAsync<{
        forgotUserId: User['id'];
      }>(hash, {
        secret: this.configService.getOrThrow('auth.forgotSecret', {
          infer: true,
        }),
      });

      userId = jwtData.forgotUserId;
    } catch {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `invalidHash`,
        },
      });
    }

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          hash: `notFound`,
        },
      });
    }

    user.password = password;

    await this.sessionService.deleteByUserId({
      userId: user.id,
    });

    await this.usersService.update(user.id, user);
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    const user = await this.usersService.findById(userJwtPayload.id);
    return user ? GroupPlainToInstance(User, user, [RoleEnum.user]) : null;
  }

  async update(
    userJwtPayload: JwtPayloadType,
    userDto: AuthUpdateDto,
  ): Promise<NullableType<User>> {
    const currentUser = await this.usersService.findById(userJwtPayload.id);

    if (!currentUser) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    if (userDto.password) {
      if (!userDto.oldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'missingOldPassword',
          },
        });
      }

      if (!currentUser.password) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      }

      const isValidOldPassword = await bcrypt.compare(
        userDto.oldPassword,
        currentUser.password,
      );

      if (!isValidOldPassword) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            oldPassword: 'incorrectOldPassword',
          },
        });
      } else {
        await this.sessionService.deleteByUserIdWithExclude({
          userId: currentUser.id,
          excludeSessionId: userJwtPayload.sessionId,
        });
      }
    }

    if (userDto.email && userDto.email !== currentUser.email) {
      const userByEmail = await this.usersService.findByEmail(userDto.email);

      if (userByEmail && userByEmail.id !== currentUser.id) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            email: 'emailExists',
          },
        });
      }

      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: currentUser.id,
          newEmail: userDto.email,
        },
        {
          secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.confirmNewEmail({
        to: userDto.email,
        data: {
          hash,
        },
      });
    }

    delete userDto.email;
    delete userDto.oldPassword;

    await this.usersService.update(userJwtPayload.id, userDto);

    const updated = await this.usersService.findById(userJwtPayload.id);
    return updated
      ? GroupPlainToInstance(User, updated, [RoleEnum.user])
      : null;
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<RefreshResponseDto> {
    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException();
    }

    if (session.hash !== data.hash) {
      throw new UnauthorizedException();
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      throw new UnauthorizedException();
    }

    await this.sessionService.update(session.id, {
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: {
        id: user.role.id,
      },
      sessionId: session.id,
      hash,
    });

    const result = {
      token,
      refreshToken,
      tokenExpires,
    };

    return GroupPlainToInstance(RefreshResponseDto, result, [RoleEnum.user]);
  }

  async refreshTokenFromUser(user?: {
    sessionId?: Session['id'];
    hash?: Session['hash'];
  }): Promise<RefreshResponseDto> {
    if (!user?.sessionId || !user.hash) {
      throw new UnauthorizedException();
    }
    return this.refreshToken({ sessionId: user.sessionId, hash: user.hash });
  }

  async softDelete(user: User): Promise<void> {
    await this.usersService.remove(user.id);
  }

  async logout(data: Pick<JwtRefreshPayloadType, 'sessionId'>) {
    return this.sessionService.deleteById(data.sessionId);
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
    hash: Session['hash'];
    externalExp?: number;
  }) {
    const expiresIn = data.externalExp
      ? data.externalExp - Math.floor(Date.now() / 1000)
      : Math.floor(
          Number(
            ms(this.configService.getOrThrow('auth.expires', { infer: true })),
          ) / 1000,
        );

    const tokenExpires =
      (data.externalExp ?? Math.floor(Date.now() / 1000) + expiresIn) * 1000;

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: expiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  async validateSocketToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayloadType>(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });

      const session = await this.sessionService.findById(payload.sessionId);

      if (!session || session.user.id !== payload.id) {
        throw new UnauthorizedException(
          '[WS] Invalid session or token mismatch',
        );
      }

      const user = await this.usersService.findById(payload.id);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (err) {
      this.logger.error('[WS] Token verification failed', err);
      throw new UnauthorizedException('[WS] Invalid or expired token');
    }
  }
}
