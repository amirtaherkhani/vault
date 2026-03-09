import { UsersService } from '../users/users.service';
import { User } from '../users/domain/user';

import {
  // common
  Injectable,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountRepository } from './infrastructure/persistence/account.repository';
import { IPaginationOptions } from '../utils/types/pagination-options.type';
import { Account } from './domain/account';
import {
  AccountProviderName,
  AccountStatus,
  KycStatus,
} from './types/account-enum.type';
import { NullableType } from '../utils/types/nullable.type';
import { AccountDto } from './dto/account.dto';
import { RoleEnum } from '../roles/roles.enum';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../utils/transformers/class.transformer';

@Injectable()
export class AccountsService {
  constructor(
    private readonly userService: UsersService,

    // Dependencies here
    private readonly accountRepository: AccountRepository,
  ) {}

  async upsertByAccountId(payload: {
    accountId: Account['accountId'];
    providerName: AccountProviderName;
    user: { id: User['id'] };
    kycStatus?: KycStatus;
    label?: Account['label'];
    status?: AccountStatus;
    customerRefId?: Account['customerRefId'];
    name?: Account['name'];
  }): Promise<AccountDto> {
    const existing = await this.accountRepository.findByAccountId(
      payload.accountId,
    );

    if (existing) {
      this.ensureFireblocksRequiredFields({
        providerName: payload.providerName ?? existing.providerName,
        customerRefId: payload.customerRefId ?? existing.customerRefId,
        name: payload.name ?? existing.name,
      });

      const updated = await this.update(existing.id, {
        kycStatus: payload.kycStatus ?? existing.kycStatus,
        label: payload.label ?? existing.label,
        status: payload.status ?? existing.status,
        accountId: payload.accountId,
        providerName: payload.providerName ?? existing.providerName,
        customerRefId: payload.customerRefId ?? existing.customerRefId,
        name: payload.name ?? existing.name,
        user:
          payload.user ??
          (existing.user?.id ? { id: existing.user.id } : undefined),
      });

      if (!updated) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            account: 'notExists',
          },
        });
      }

      return updated;
    }

    this.ensureFireblocksRequiredFields({
      providerName: payload.providerName,
      customerRefId: payload.customerRefId,
      name: payload.name,
    });

    return this.create({
      user: payload.user,
      kycStatus: payload.kycStatus,
      label: payload.label,
      status: payload.status,
      accountId: payload.accountId,
      providerName: payload.providerName,
      customerRefId: payload.customerRefId,
      name: payload.name,
    });
  }

  async create(createAccountDto: CreateAccountDto): Promise<AccountDto> {
    // Do not remove comment below.
    // <creating-property />
    this.ensureFireblocksRequiredFields({
      providerName: createAccountDto.providerName,
      customerRefId: createAccountDto.customerRefId,
      name: createAccountDto.name,
    });

    const userObject = await this.userService.findById(
      createAccountDto.user.id,
    );
    if (!userObject) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notExists',
        },
      });
    }
    const user = userObject;

    const account = await this.accountRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      customerRefId: createAccountDto.customerRefId ?? null,

      name: createAccountDto.name ?? null,

      kycStatus: createAccountDto.kycStatus ?? KycStatus.PENDING,

      label: createAccountDto.label,

      status: createAccountDto.status ?? AccountStatus.ACTIVE,

      accountId: createAccountDto.accountId,

      providerName: createAccountDto.providerName,

      user,
    });

    return GroupPlainToInstance(AccountDto, account, [RoleEnum.admin]);
  }

  async createBulk(
    createAccountDtos: CreateAccountDto[],
  ): Promise<AccountDto[]> {
    if (!createAccountDtos?.length) {
      return [];
    }

    const userIds = Array.from(
      new Set(
        createAccountDtos
          .map((dto) => dto.user?.id)
          .filter(
            (id): id is User['id'] => typeof id !== 'undefined' && id !== null,
          ),
      ),
    );
    const normalizedUserIds = userIds
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id));
    const users = await this.userService.findByIds(normalizedUserIds);
    const usersById = new Map(users.map((user) => [user.id, user]));
    const missingUserId = userIds.find((id) => !usersById.has(Number(id)));

    if (typeof missingUserId !== 'undefined') {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notExists',
        },
      });
    }

    createAccountDtos.forEach((dto) =>
      this.ensureFireblocksRequiredFields({
        providerName: dto.providerName,
        customerRefId: dto.customerRefId,
        name: dto.name,
      }),
    );

    const accounts = await this.accountRepository.createMany(
      createAccountDtos.map((dto) => ({
        customerRefId: dto.customerRefId ?? null,

        name: dto.name ?? null,

        kycStatus: dto.kycStatus ?? KycStatus.PENDING,

        label: dto.label,

        status: dto.status ?? AccountStatus.ACTIVE,

        accountId: dto.accountId,

        providerName: dto.providerName,

        user: usersById.get(Number(dto.user.id)) as User,
      })),
    );

    return GroupPlainToInstances(AccountDto, accounts, [RoleEnum.admin]);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });

    return GroupPlainToInstances(AccountDto, accounts, [RoleEnum.admin]);
  }

  async findByIdOrFail(
    id: Account['id'],
    userId?: User['id'],
  ): Promise<Account> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: 'notExists',
        },
      });
    }

    return account;
  }

  async findById(
    id: Account['id'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.findByIdOrFail(id);

    return GroupPlainToInstance(AccountDto, account, roles);
  }

  async findByMe(
    id: Account['id'],
    userId: User['id'],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: 'notExists',
        },
      });
    }
    return GroupPlainToInstance(AccountDto, account, [RoleEnum.user]);
  }

  async findByIds(
    ids: Account['id'][],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.findByIds(ids);
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  async findAllByUserId(
    userId: User['id'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.findAllByUserId(userId);
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  async filter(
    userId?: User['id'],
    label?: Account['label'],
    status?: Account['status'],
    accountId?: Account['accountId'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.filter(
      userId,
      label,
      status,
      accountId,
    );
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  async findActives(
    userId?: User['id'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.findActives(userId);
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  countAll(userId?: User['id']) {
    return this.accountRepository.countAll(userId);
  }

  countActives(userId?: User['id']) {
    return this.accountRepository.countActives(userId);
  }

  async hasCompletedKyc(userId: User['id']): Promise<boolean> {
    const accounts = await this.accountRepository.findAllByUserId(userId);
    return accounts.some((account) => account.kycStatus === KycStatus.VERIFIED);
  }

  async findByAccountId(
    accountId: Account['accountId'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.accountRepository.findByAccountId(accountId);
    return account ? GroupPlainToInstance(AccountDto, account, roles) : null;
  }

  async findDomainByAccountId(
    accountId: Account['accountId'],
  ): Promise<NullableType<Account>> {
    return this.accountRepository.findByAccountId(accountId);
  }

  async findByUserSocialId(
    socialId: User['socialId'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts = await this.accountRepository.findByUserSocialId(socialId);
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  async findByProviderName(
    providerName: Account['providerName'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<AccountDto[]> {
    const accounts =
      await this.accountRepository.findByProviderName(providerName);
    return GroupPlainToInstances(AccountDto, accounts, roles);
  }

  async findBySocialIdAndProviderName(
    socialId: User['socialId'],
    providerName: Account['providerName'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.accountRepository.findBySocialIdAndProviderName(
      socialId,
      providerName,
    );
    return account ? GroupPlainToInstance(AccountDto, account, roles) : null;
  }

  async findByMeAndProviderName(
    userId: User['id'],
    providerName: Account['providerName'],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.accountRepository.findByUserIdAndProviderName(
      userId,
      providerName,
    );
    if (!account) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: 'notExists',
        },
      });
    }
    return GroupPlainToInstance(AccountDto, account, [RoleEnum.user]);
  }

  async update(
    id: Account['id'],

    updateAccountDto: UpdateAccountDto,
  ): Promise<NullableType<AccountDto>> {
    // Do not remove comment below.
    // <updating-property />

    const existing = await this.accountRepository.findById(id);
    if (!existing) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          account: 'notExists',
        },
      });
    }

    let user: User | undefined = undefined;

    if (updateAccountDto.user) {
      const userObject = await this.userService.findById(
        updateAccountDto.user.id,
      );
      if (!userObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            user: 'notExists',
          },
        });
      }
      user = userObject;
    }

    const payload: Partial<Account> = {};
    if (typeof updateAccountDto.customerRefId !== 'undefined') {
      payload.customerRefId = updateAccountDto.customerRefId;
    }
    if (typeof updateAccountDto.name !== 'undefined') {
      payload.name = updateAccountDto.name;
    }
    if (typeof updateAccountDto.kycStatus !== 'undefined') {
      payload.kycStatus = updateAccountDto.kycStatus;
    }
    if (typeof updateAccountDto.label !== 'undefined') {
      payload.label = updateAccountDto.label;
    }
    if (typeof updateAccountDto.status !== 'undefined') {
      payload.status = updateAccountDto.status;
    }
    if (typeof updateAccountDto.accountId !== 'undefined') {
      payload.accountId = updateAccountDto.accountId;
    }
    if (typeof updateAccountDto.providerName !== 'undefined') {
      payload.providerName = updateAccountDto.providerName;
    }
    if (user) {
      payload.user = user;
    }

    const nextProviderName = payload.providerName ?? existing.providerName;
    const nextCustomerRefId = payload.customerRefId ?? existing.customerRefId;
    const nextName = payload.name ?? existing.name;

    this.ensureFireblocksRequiredFields({
      providerName: nextProviderName,
      customerRefId: nextCustomerRefId,
      name: nextName,
    });

    const account = await this.accountRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
      ...payload,
    });

    return account
      ? GroupPlainToInstance(AccountDto, account, [RoleEnum.admin])
      : null;
  }

  remove(id: Account['id']) {
    return this.accountRepository.remove(id);
  }

  private ensureFireblocksRequiredFields(params: {
    providerName?: AccountProviderName;
    customerRefId?: Account['customerRefId'];
    name?: Account['name'];
  }) {
    if (params.providerName !== AccountProviderName.FIREBLOCKS) {
      return;
    }

    const hasCustomerRefId =
      typeof params.customerRefId === 'string'
        ? params.customerRefId.trim().length > 0
        : !!params.customerRefId;
    const hasName =
      typeof params.name === 'string'
        ? params.name.trim().length > 0
        : !!params.name;

    if (!hasCustomerRefId || !hasName) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          customerRefId: hasCustomerRefId ? undefined : 'requiredForFireblocks',
          name: hasName ? undefined : 'requiredForFireblocks',
        },
      });
    }
  }

  async findByName(
    name: Account['name'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<NullableType<AccountDto>> {
    const account = await this.accountRepository.findByName(name);
    return account ? GroupPlainToInstance(AccountDto, account, roles) : null;
  }

  async findBySocialId(
    socialId: User['socialId'],
    providerName: Account['providerName'],
    roles: RoleEnum[] = [RoleEnum.admin],
  ): Promise<NullableType<AccountDto>> {
    const user = await this.userService.findBySocialId(socialId);
    if (!user) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          user: 'notExists',
        },
      });
    }
    const account = await this.accountRepository.findBySocialId(
      user.id,
      socialId,
      providerName,
    );
    return account ? GroupPlainToInstance(AccountDto, account, roles) : null;
  }
}
