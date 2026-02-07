import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import jwksRsa, { JwksClient, RsaSigningKey } from 'jwks-rsa';
import { AuthVeroLoginDto } from './dto/auth-vero-login.dto';
import { AuthVeroCreateDto } from './dto/auth-vero-create.dto';
import { AuthVeroBulkCreateDto } from './dto/auth-vero-bulk-create.dto';
import { AuthVeroBulkUpdateDto } from './dto/auth-vero-bulk-update.dto';
import { SocialInterface } from '../social/interfaces/social.interface';
import { VeroPayloadMapper } from './infrastructure/persistence/relational/mappers/vero.mapper';
import { AllConfigType } from '../config/config.type';
import {
  BASE_VALUE_JWKS_URL,
  DEFAULT_JWKS_CACHE_MAX_AGE,
  VERO_ENABLE_DYNAMIC_CACHE,
} from './types/vero-const.type';
import { UsersService } from '../users/users.service';
import { RoleEnum } from '../roles/roles.enum';
import { StatusEnum } from '../statuses/statuses.enum';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { UNKNOWN_USER_NAME_PLACEHOLDER } from '../users/constants/user.constants';
import { User } from '../users/domain/user';
import { GroupPlainToInstances } from '../utils/transformers/class.transformer';

@Injectable()
export class AuthVeroService {
  private jwksClient: JwksClient;
  private lastKeyChangeTimestamp: number;
  private keyUsageCounter: number;
  private enableDynamicCache: boolean;
  private readonly logger = new Logger(AuthVeroService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private jwtService: JwtService,
    private veroMapper: VeroPayloadMapper,
    private readonly usersService: UsersService,
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

    return GroupPlainToInstances(User, [...existingUsers, ...createdUsers], [
      RoleEnum.admin,
    ]);
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

    return GroupPlainToInstances(User, [...updatedUsers, ...untouched], [
      RoleEnum.admin,
    ]);
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
