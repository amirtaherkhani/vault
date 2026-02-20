import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import axios, { isAxiosError } from 'axios';
import { createHash } from 'crypto';
import jwksRsa, { JwksClient, RsaSigningKey } from 'jwks-rsa';
import { AuthVeroLoginDto } from './dto/auth-vero-login.dto';
import { AuthVeroCreateDto } from './dto/auth-vero-create.dto';
import { AuthVeroBulkCreateDto } from './dto/auth-vero-bulk-create.dto';
import { AuthVeroBulkUpdateDto } from './dto/auth-vero-bulk-update.dto';
import type { SocialInterface } from '../social/interfaces/social.interface';
import { VeroPayloadMapper } from './infrastructure/persistence/relational/mappers/vero.mapper';
import { AllConfigType } from '../config/config.type';
import {
  BASE_VALUE_VERO_API_URL,
  BASE_VALUE_JWKS_URL,
  DEFAULT_VERO_TOKEN_CACHE_TTL_SECONDS,
  DEFAULT_JWKS_CACHE_MAX_AGE,
  VERO_ENABLE_DYNAMIC_CACHE,
  VERO_PROFILE_PATH,
} from './types/vero-auth-const.type';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { UNKNOWN_USER_NAME_PLACEHOLDER } from '../users/constants/user.constants';
import { User } from '../users/domain/user';
import { GroupPlainToInstances } from '../utils/transformers/class.transformer';
import { CacheService } from '../common/cache';
import { SessionService } from '../session/session.service';
import type { Session } from '../session/domain/session';
import { SessionMetadata } from '../session/types/session-base.type';
import type {
  VeroProfileResult,
  VeroTokenCacheEntry,
} from './types/vero-auth-base.type';
import { InternalEventsService } from '../common/internal-events/internal-events.service';
import { DataSource } from 'typeorm';
import { UserInternalEvent } from '../users/events/user.event';
import { InternalEventPayload } from '../common/internal-events/types/internal-events.type';

@Injectable()
export class AuthVeroService {
  private jwksClient: JwksClient;
  private lastKeyChangeTimestamp: number;
  private keyUsageCounter: number;
  private enableDynamicCache: boolean;
  private readonly logger = new Logger(AuthVeroService.name);
  private readonly localTokenCache = new Map<string, VeroTokenCacheEntry>();

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private jwtService: JwtService,
    private veroMapper: VeroPayloadMapper,
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly cacheService: CacheService,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
  ) {
    const jwksUri =
      this.configService.get('vero.jwksUri', { infer: true }) ||
      BASE_VALUE_JWKS_URL;
    const cacheMaxAge =
      this.configService.get('vero.jwksUriCacheMaxAge', { infer: true }) ||
      DEFAULT_JWKS_CACHE_MAX_AGE;

    this.enableDynamicCache =
      this.configService.get('vero.enableDynamicCache', { infer: true }) ||
      VERO_ENABLE_DYNAMIC_CACHE;
    this.lastKeyChangeTimestamp = Date.now();
    this.keyUsageCounter = 0;

    this.jwksClient = this.createJwksClient(jwksUri, cacheMaxAge);
  }

  private createJwksClient(jwksUri: string, cacheMaxAge: number): JwksClient {
    return jwksRsa({
      jwksUri,
      cache: false,
      cacheMaxAge,
    });
  }

  private adjustCacheDuration() {
    if (!this.enableDynamicCache) {
      this.logger.debug(
        'Dynamic cache adjustment is disabled. Using default cache duration.',
      );
      return;
    }

    const elapsedTimeSinceLastChange = Date.now() - this.lastKeyChangeTimestamp;
    const usageFrequency =
      this.keyUsageCounter / (elapsedTimeSinceLastChange / 1000); // Requests per second

    // Default cache duration: 15 minutes
    let newCacheMaxAge = DEFAULT_JWKS_CACHE_MAX_AGE;

    // Reduce cache duration for high usage
    if (usageFrequency > 1) {
      newCacheMaxAge = 5 * 60 * 1000; // 5 minutes
    }
    // Increase cache duration for low usage or stable keys
    else if (elapsedTimeSinceLastChange > 2 * 60 * 60 * 1000) {
      newCacheMaxAge = 30 * 60 * 1000; // 30 minutes
    }

    this.logger.debug(
      `Adjusting JWKS cache duration to ${newCacheMaxAge / 1000} seconds`,
    );

    const jwksUri =
      this.configService.get('vero.jwksUri', { infer: true }) ||
      BASE_VALUE_JWKS_URL;

    // Re-create the JwksClient with the updated cache duration
    this.jwksClient = this.createJwksClient(jwksUri, newCacheMaxAge);
  }

  isExternalTokenMode(): boolean {
    return (
      (this.configService.get('vero.useExternalToken', {
        infer: true,
      }) ??
        false) ||
      this.enableDynamicCache
    );
  }

  private getVeroApiBaseUrl(): string {
    return (
      this.configService.get('vero.apiBaseUrl', { infer: true }) ??
      BASE_VALUE_VERO_API_URL
    );
  }

  private extractTokenExp(token: string): number | undefined {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;
    if (!decoded || typeof decoded.exp !== 'number') {
      return undefined;
    }
    return decoded.exp;
  }

  private buildTokenCacheKey(token: string): string {
    const hash = createHash('sha256').update(token).digest('hex');
    return `vero:token:${hash}`;
  }

  private async createSessionForUser(
    user: User,
    metadata?: SessionMetadata,
  ): Promise<Session> {
    const hash = createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');
    return this.sessionService.create(
      {
        user,
        hash,
        lastUsedAt: new Date(),
      },
      metadata,
    );
  }

  private resolveCacheTtlSecondsFromExpiresAt(expiresAt: number): number {
    const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) {
      return DEFAULT_VERO_TOKEN_CACHE_TTL_SECONDS;
    }
    return remainingSeconds;
  }

  private attachSessionToUser(
    user: User,
    sessionId?: Session['id'],
  ): User & { sessionId?: Session['id'] } {
    if (sessionId) {
      (user as User & { sessionId?: Session['id'] }).sessionId = sessionId;
    }
    return user as User & { sessionId?: Session['id'] };
  }

  private async getCachedTokenEntry(
    token: string,
  ): Promise<VeroTokenCacheEntry | null> {
    const key = this.buildTokenCacheKey(token);
    if (this.cacheService.isEnabled()) {
      const entry = await this.cacheService.get<VeroTokenCacheEntry>(key);
      return entry?.value ?? null;
    }

    const cached = this.localTokenCache.get(key);
    if (!cached) {
      return null;
    }
    if (cached.expiresAt <= Date.now()) {
      this.localTokenCache.delete(key);
      return null;
    }
    return cached;
  }

  private async setCachedTokenEntry(
    token: string,
    entry: VeroTokenCacheEntry,
    ttlSeconds: number,
  ): Promise<void> {
    const key = this.buildTokenCacheKey(token);
    if (this.cacheService.isEnabled()) {
      await this.cacheService.set(key, entry, ttlSeconds);
      return;
    }

    this.localTokenCache.set(key, entry);
  }

  private resolveTokenCacheTtlSeconds(exp?: number): number {
    if (!exp) {
      return DEFAULT_VERO_TOKEN_CACHE_TTL_SECONDS;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remaining = exp - nowSeconds;
    if (remaining <= 0) {
      return DEFAULT_VERO_TOKEN_CACHE_TTL_SECONDS;
    }
    return Math.min(remaining, DEFAULT_VERO_TOKEN_CACHE_TTL_SECONDS);
  }

  private async getKey(header: {
    kid: string | null | undefined;
  }): Promise<string> {
    this.keyUsageCounter += 1; // Track key usage

    return new Promise((resolve, reject) => {
      if (!header.kid) {
        reject(new UnauthorizedException('Missing "kid" in token header.'));
        return;
      }

      this.jwksClient.getSigningKey(header.kid, (err, key) => {
        if (err || !key) {
          reject(new UnauthorizedException('Failed to retrieve signing key.'));
        } else {
          const signingKey = (key as RsaSigningKey).getPublicKey();

          if (this.enableDynamicCache) {
            this.logger.debug('JWKS key retrieved.');
            this.lastKeyChangeTimestamp = Date.now();
            this.adjustCacheDuration();
          }
          resolve(signingKey);
        }
      });
    });
  }

  async verifyToken(token: string): Promise<any> {
    const getSigningKey = async (header: {
      kid: string | null | undefined;
    }): Promise<string> => {
      if (!header || !header.kid) {
        throw new UnauthorizedException('Token header is missing "kid".');
      }
      return this.getKey(header);
    };

    try {
      // Decode token header to resolve the signing key
      const decodedHeader = this.jwtService.decode(token, {
        complete: true,
      }) as { header: { kid: string } };
      if (!decodedHeader || !decodedHeader.header) {
        throw new UnauthorizedException('Invalid token header.');
      }
      const secret = await getSigningKey(decodedHeader.header);

      // Verify token using the resolved signing key
      return await this.jwtService.verifyAsync(token, {
        secret,
        algorithms: ['RS256'],
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('Token has expired.');
      }
      throw new UnauthorizedException('Invalid token.');
    }
  }

  async getProfileByToken(
    loginDto: AuthVeroLoginDto,
  ): Promise<{ profile: SocialInterface; exp?: number }> {
    const decodedToken = await this.verifyToken(loginDto.veroToken);
    const exp = decodedToken.exp;
    const profile = this.veroMapper.mapPayloadToSocial(decodedToken);
    return { profile, exp };
  }

  async getProfileFromExternalToken(token: string): Promise<VeroProfileResult> {
    const profilePayload = await this.fetchVeroProfile(token);
    const profile = this.veroMapper.mapPayloadToSocial(profilePayload);
    const exp = this.extractTokenExp(token);
    return { profile, exp, rawProfile: profilePayload };
  }

  private async getProfileFromVerifiedToken(
    token: string,
  ): Promise<VeroProfileResult> {
    const decodedToken = await this.verifyToken(token);
    const profile = this.veroMapper.mapPayloadToSocial(decodedToken);
    const exp = decodedToken?.exp;
    return { profile, exp, rawProfile: decodedToken };
  }

  async loginWithExternalToken(
    loginDto: AuthVeroLoginDto,
    sessionMetadata?: SessionMetadata,
  ): Promise<{
    token: string;
    refreshToken: string;
    tokenExpires: number;
    user: User;
  }> {
    const { profile, exp, rawProfile } = this.enableDynamicCache
      ? await this.getProfileFromVerifiedToken(loginDto.veroToken)
      : await this.getProfileFromExternalToken(loginDto.veroToken);
    const user = await this.resolveUserFromVeroProfile(profile, rawProfile);
    const identity = this.resolveVeroIdentity(profile, rawProfile);
    const cached = await this.getCachedTokenEntry(loginDto.veroToken);
    let sessionId = cached?.sessionId;
    if (!sessionId) {
      const session = await this.createSessionForUser(user, sessionMetadata);
      sessionId = session.id;
    } else if (sessionMetadata) {
      const updates: Partial<Session> = {
        lastUsedAt: new Date(),
      };
      if (sessionMetadata.deviceName) {
        updates.deviceName = sessionMetadata.deviceName;
      }
      if (sessionMetadata.deviceType) {
        updates.deviceType = sessionMetadata.deviceType;
      }
      if (sessionMetadata.appVersion) {
        updates.appVersion = sessionMetadata.appVersion;
      }
      if (sessionMetadata.country) {
        updates.country = sessionMetadata.country;
      }
      if (sessionMetadata.city) {
        updates.city = sessionMetadata.city;
      }
      await this.sessionService.update(sessionId, updates);
    }
    const ttlSeconds = cached
      ? this.resolveCacheTtlSecondsFromExpiresAt(cached.expiresAt)
      : this.resolveTokenCacheTtlSeconds(exp);
    const expiresAt =
      cached?.expiresAt ?? (exp ? exp * 1000 : Date.now() + ttlSeconds * 1000);
    await this.setCachedTokenEntry(
      loginDto.veroToken,
      {
        internalUserId: user.id,
        veroIdentity: identity,
        expiresAt,
        sessionId,
      },
      ttlSeconds,
    );
    await this.emitUserLoggedInEvent(user);
    const tokenExpires = exp ? exp * 1000 : 0;
    return {
      token: loginDto.veroToken,
      refreshToken: '',
      tokenExpires,
      user,
    };
  }

  private async emitUserLoggedInEvent(user: User): Promise<void> {
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

  async resolveUserFromExternalToken(
    token: string,
    options: { attachSession?: boolean } = {},
  ): Promise<User & { sessionId?: Session['id'] }> {
    if (!this.isExternalTokenMode()) {
      throw new UnauthorizedException('Vero external token auth is disabled.');
    }

    const attachSession = options.attachSession ?? true;
    const cached = await this.getCachedTokenEntry(token);
    if (cached) {
      const cachedUser = await this.usersService.findById(
        cached.internalUserId,
      );
      if (cachedUser) {
        let sessionId = cached.sessionId;
        if (!sessionId) {
          const session = await this.createSessionForUser(cachedUser);
          sessionId = session.id;
          const ttlSeconds = this.resolveCacheTtlSecondsFromExpiresAt(
            cached.expiresAt,
          );
          await this.setCachedTokenEntry(
            token,
            {
              ...cached,
              sessionId,
            },
            ttlSeconds,
          );
        }
        return attachSession
          ? this.attachSessionToUser(cachedUser, sessionId)
          : cachedUser;
      }
    }

    const { profile, exp, rawProfile } = this.enableDynamicCache
      ? await this.getProfileFromVerifiedToken(token)
      : await this.getProfileFromExternalToken(token);
    const user = await this.resolveUserFromVeroProfile(profile, rawProfile);
    const identity = this.resolveVeroIdentity(profile, rawProfile);
    const session = await this.createSessionForUser(user);
    const ttlSeconds = this.resolveTokenCacheTtlSeconds(exp);
    const expiresAt = exp ? exp * 1000 : Date.now() + ttlSeconds * 1000;
    await this.setCachedTokenEntry(
      token,
      {
        internalUserId: user.id,
        veroIdentity: identity,
        expiresAt,
        sessionId: session.id,
      },
      ttlSeconds,
    );
    return attachSession ? this.attachSessionToUser(user, session.id) : user;
  }

  private async fetchVeroProfile(token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.getVeroApiBaseUrl()}${VERO_PROFILE_PATH}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 5000,
        },
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status && status >= 400 && status < 500) {
          throw new UnauthorizedException('Invalid Vero token.');
        }
      }
      throw new ServiceUnavailableException('Unable to validate Vero token.');
    }
  }

  private resolveVeroIdentity(
    profile: SocialInterface,
    rawProfile: any,
  ): { socialId?: string; email?: string | null } {
    const email = profile.email?.toLowerCase() ?? null;
    const preferredId =
      rawProfile?.veroUserId ??
      rawProfile?.userId ??
      rawProfile?.uid ??
      rawProfile?.id ??
      profile.id;
    const normalizedId =
      preferredId && String(preferredId).trim()
        ? String(preferredId).trim()
        : undefined;
    const resolvedId = normalizedId ?? email ?? undefined;
    return {
      socialId: resolvedId ? String(resolvedId) : undefined,
      email,
    };
  }

  private async resolveUserFromVeroProfile(
    profile: SocialInterface,
    rawProfile: any,
  ): Promise<User> {
    const identity = this.resolveVeroIdentity(profile, rawProfile);
    const socialEmail = identity.email;
    const socialId = identity.socialId;

    let user: User | null = null;
    let userByEmail: User | null = null;

    if (socialEmail) {
      userByEmail = await this.usersService.findByEmail(socialEmail);
    }

    if (socialId) {
      user = await this.usersService.findBySocialIdAndProvider({
        socialId,
        provider: AuthProvidersEnum.vero,
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
        profile.firstName,
      );
      const lastNameUpdate = this.resolveNameUpdate(
        user.lastName,
        profile.lastName,
      );

      if (firstNameUpdate) {
        updates.firstName = firstNameUpdate;
      }
      if (lastNameUpdate) {
        updates.lastName = lastNameUpdate;
      }

      if (socialId && user.socialId !== socialId) {
        updates.socialId = socialId;
      }
      if (user.provider !== AuthProvidersEnum.vero) {
        updates.provider = AuthProvidersEnum.vero;
      }

      if (Object.keys(updates).length) {
        await this.usersService.update(user.id, updates);
        user = await this.usersService.findById(user.id);
      }
    } else if (userByEmail) {
      const updates: Partial<User> = {};
      if (socialId && userByEmail.socialId !== socialId) {
        updates.socialId = socialId;
      }
      if (userByEmail.provider !== AuthProvidersEnum.vero) {
        updates.provider = AuthProvidersEnum.vero;
      }

      if (Object.keys(updates).length) {
        await this.usersService.update(userByEmail.id, updates);
        user = await this.usersService.findById(userByEmail.id);
      } else {
        user = userByEmail;
      }
    } else if (socialId || socialEmail) {
      const role = {
        id: RoleEnum.user,
      };
      const status = {
        id: StatusEnum.active,
      };

      const createdUser = await this.usersService.create({
        email: socialEmail ?? null,
        firstName: this.normalizeNameValue(profile.firstName) ?? null,
        lastName: this.normalizeNameValue(profile.lastName) ?? null,
        socialId: socialId ?? null,
        provider: AuthProvidersEnum.vero,
        role,
        status,
      });

      user = await this.usersService.findById(createdUser.id);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'userNotFound',
        },
      });
    }

    return user;
  }

  async createUser(createDto: AuthVeroCreateDto): Promise<User> {
    const [user] = await this.bulkCreateUsers({
      users: [createDto],
    });

    if (!user) {
      this.logger.debug(
        'Vero create - no user created or matched for single request',
      );
      throw new UnprocessableEntityException(
        'User could not be created or matched',
      );
    }

    return user;
  }

  async bulkCreateUsers(bulkCreateDto: AuthVeroBulkCreateDto): Promise<User[]> {
    const sanitizedUsers = bulkCreateDto.users.map((user) => ({
      email: user.email?.toLowerCase() ?? null,
      socialId: user.socialId?.trim(),
      firstName: this.normalizeNameValue(user.firstName) ?? null,
      lastName: this.normalizeNameValue(user.lastName) ?? null,
    }));
    this.logger.debug(
      `Vero bulk create - incoming users: ${sanitizedUsers.length}`,
    );

    const dedupedByEmail: typeof sanitizedUsers = [];
    const seenEmails = new Set<string>();

    for (const user of sanitizedUsers) {
      const email = user.email;
      if (email) {
        if (seenEmails.has(email)) {
          continue;
        }
        seenEmails.add(email);
      }
      dedupedByEmail.push(user);
    }
    this.logger.debug(
      `Vero bulk create - deduped by email count: ${dedupedByEmail.length}`,
    );

    const socialIds = dedupedByEmail
      .map((user) => user.socialId)
      .filter((socialId): socialId is string => !!socialId);

    const existingUsers = await this.usersService.findByProviderAndSocialIds({
      socialIds,
      provider: AuthProvidersEnum.vero,
    });

    const existingSocialIds = new Set(
      existingUsers.map((user) => user.socialId).filter(Boolean) as string[],
    );
    this.logger.debug(
      `Vero bulk create - unique socialIds: ${socialIds.length}, existing matched: ${existingUsers.length}`,
    );

    const emails = dedupedByEmail
      .map((user) => user.email)
      .filter((email): email is string => !!email);

    const existingEmails = emails.length
      ? await this.usersService.findByEmails(emails)
      : [];

    const usedEmails = new Set(
      existingEmails
        .map((user) => user.email?.toLowerCase())
        .filter((email): email is string => !!email),
    );
    this.logger.debug(
      `Vero bulk create - unique emails in request: ${emails.length}, existing emails: ${existingEmails.length}`,
    );
    const seenSocialIds = new Set<string>();
    const payloads: Omit<
      User,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt'
    >[] = [];

    for (const user of dedupedByEmail) {
      if (!user.socialId || seenSocialIds.has(user.socialId)) {
        continue;
      }
      seenSocialIds.add(user.socialId);

      if (existingSocialIds.has(user.socialId)) {
        continue;
      }

      if (user.email) {
        if (usedEmails.has(user.email)) {
          continue;
        }
        usedEmails.add(user.email);
      }

      payloads.push({
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        email: user.email,
        provider: AuthProvidersEnum.vero,
        socialId: user.socialId,
        role: { id: RoleEnum.user },
        status: { id: StatusEnum.active },
      });
    }
    this.logger.debug(
      `Vero bulk create - payloads to create: ${payloads.length}`,
    );

    const createdUsers = payloads.length
      ? await this.usersService.createMany(payloads)
      : [];
    this.logger.debug(
      `Vero bulk create - created: ${createdUsers.length}, returning total: ${
        existingUsers.length + createdUsers.length
      }`,
    );

    return GroupPlainToInstances(
      User,
      [...existingUsers, ...createdUsers],
      [RoleEnum.admin],
    );
  }

  async bulkUpdateUsers(bulkUpdateDto: AuthVeroBulkUpdateDto): Promise<User[]> {
    const socialIds = bulkUpdateDto.users
      .map((user) => user.socialId?.trim())
      .filter((socialId): socialId is string => !!socialId);
    this.logger.debug(
      `Vero bulk update - incoming users: ${bulkUpdateDto.users.length}, with socialIds: ${socialIds.length}`,
    );

    if (!socialIds.length) {
      return [];
    }

    const existingUsers = await this.usersService.findByProviderAndSocialIds({
      socialIds,
      provider: AuthProvidersEnum.vero,
    });
    const existingUsersMap = new Map(
      existingUsers
        .filter((user) => user.socialId)
        .map((user) => [String(user.socialId), user]),
    );
    this.logger.debug(
      `Vero bulk update - existing matched by socialId: ${existingUsers.length}`,
    );

    const emails = bulkUpdateDto.users
      .map((user) => user.email?.toLowerCase())
      .filter((email): email is string => !!email);

    const existingEmails = emails.length
      ? await this.usersService.findByEmails(emails)
      : [];
    const emailOwnerMap = new Map(
      existingEmails
        .filter((user) => user.email)
        .map((user) => [String(user.email).toLowerCase(), user.id]),
    );
    this.logger.debug(
      `Vero bulk update - emails in request: ${emails.length}, existing email owners: ${existingEmails.length}`,
    );

    const payloads: { id: User['id']; payload: Partial<User> }[] = [];
    const untouched: User[] = [];
    const processedIds = new Set<number>();
    const reservedEmails = new Set<string>();

    for (const user of bulkUpdateDto.users) {
      const socialId = user.socialId?.trim();
      if (!socialId) {
        continue;
      }

      const existingUser = existingUsersMap.get(socialId);
      if (!existingUser || processedIds.has(Number(existingUser.id))) {
        continue;
      }

      const updates: Partial<User> = {};
      const normalizedEmail = user.email?.toLowerCase();

      if (
        normalizedEmail &&
        normalizedEmail !== existingUser.email?.toLowerCase()
      ) {
        const ownerId = emailOwnerMap.get(normalizedEmail);
        if (ownerId && ownerId !== existingUser.id) {
          continue;
        }

        if (reservedEmails.has(normalizedEmail)) {
          continue;
        }

        reservedEmails.add(normalizedEmail);
        updates.email = normalizedEmail;
      }

      const firstNameUpdate = this.resolveNameUpdate(
        existingUser.firstName,
        user.firstName,
      );
      const lastNameUpdate = this.resolveNameUpdate(
        existingUser.lastName,
        user.lastName,
      );

      if (firstNameUpdate) {
        updates.firstName = firstNameUpdate;
      }
      if (lastNameUpdate) {
        updates.lastName = lastNameUpdate;
      }

      if (Object.keys(updates).length) {
        updates.provider = existingUser.provider ?? AuthProvidersEnum.vero;
        updates.socialId = socialId;
        payloads.push({ id: existingUser.id, payload: updates });
      } else {
        untouched.push(existingUser);
      }

      processedIds.add(Number(existingUser.id));
    }
    this.logger.debug(
      `Vero bulk update - payloads to update: ${payloads.length}, untouched: ${untouched.length}`,
    );

    const updatedUsers = payloads.length
      ? await this.usersService.updateMany(payloads)
      : [];
    this.logger.debug(
      `Vero bulk update - updated: ${updatedUsers.length}, returning total: ${
        updatedUsers.length + untouched.length
      }`,
    );

    return GroupPlainToInstances(
      User,
      [...updatedUsers, ...untouched],
      [RoleEnum.admin],
    );
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
}
