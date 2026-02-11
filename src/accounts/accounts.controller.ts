import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountDto } from './dto/account.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllAccountsDto } from './dto/find-all-accounts.dto';
import {
  FilterAccountsAdminDto,
  FilterAccountsDto,
} from './dto/query-account.dto';
import {
  AccountIdParamDto,
  AccountAccountIdParamDto,
  AccountProviderNameParamDto,
  AccountSocialIdParamDto,
  AccountUserIdParamDto,
  AccountAccountNameParamDto,
} from './dto/param-account.dto';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { ApiOperationRoles } from '../utils/decorators/swagger.decorator';
import { RequestWithUser } from '../utils/types/object.type';
import { DisabledEndpoint } from '../utils/decorators/disabled-endpoint.decorator';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard)
@Controller({
  path: 'accounts',
  version: '1',
})
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Create account', [RoleEnum.admin])
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: AccountDto })
  @DisabledEndpoint({ markDeprecated: true })
  async create(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountDto> {
    return this.accountsService.create(createAccountDto);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('List all accounts with pagination', [RoleEnum.admin])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: InfinityPaginationResponse(AccountDto),
  })
  async findAll(
    @Query() query: FindAllAccountsDto,
  ): Promise<InfinityPaginationResponseDto<AccountDto>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const accounts = await this.accountsService.findAllWithPagination({
      paginationOptions: {
        page,
        limit,
      },
    });

    return infinityPagination(accounts, { page, limit });
  }

  @ApiOperationRoles('Get accounts for logged-in user')
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findAllByMe(@Request() req: RequestWithUser): Promise<AccountDto[]> {
    return this.accountsService.findAllByUserId(req.user.id, [RoleEnum.user]);
  }

  @ApiOperationRoles('Filter accounts for logged-in user')
  @Get('me/filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async filterByMe(
    @Request() req: RequestWithUser,
    @Query() query: FilterAccountsDto,
  ): Promise<AccountDto[]> {
    return this.accountsService.filter(
      req.user.id,
      query.label,
      query.status,
      query.accountId,
      [RoleEnum.user],
    );
  }

  @ApiOperationRoles('Get active accounts for logged-in user')
  @Get('me/actives')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findActivesByMe(
    @Request() req: RequestWithUser,
  ): Promise<AccountDto[]> {
    return this.accountsService.findActives(req.user.id, [RoleEnum.user]);
  }

  @ApiOperationRoles('Get account by provider for logged-in user')
  @Get('me/providers/:providerName')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto })
  findByProviderForMe(
    @Param() params: AccountProviderNameParamDto,
    @Request() req: RequestWithUser,
  ) {
    return this.accountsService.findByMeAndProviderName(
      req.user.id,
      params.providerName,
    );
  }

  @ApiOperationRoles('Count accounts for logged-in user')
  @Get('me/count')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Number })
  countMyAccounts(@Request() req: RequestWithUser) {
    return this.accountsService.countAll(req.user.id);
  }

  @ApiOperationRoles('Count active accounts for logged-in user')
  @Get('me/actives/count')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Number })
  countMyActiveAccounts(@Request() req: RequestWithUser) {
    return this.accountsService.countActives(req.user.id);
  }

  @ApiOperationRoles('Check if current user passed KYC')
  @Get('me/kyc')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Boolean })
  async checkMyKycStatus(@Request() req: RequestWithUser) {
    return {
      isKycCompleted: await this.accountsService.hasCompletedKyc(req.user.id),
    };
  }

  @ApiOperationRoles('Get account by ID for logged-in user')
  @Get('me/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto })
  async findByMe(
    @Param() params: AccountIdParamDto,
    @Request() req: RequestWithUser,
  ): Promise<AccountDto | null> {
    return this.accountsService.findByMe(params.id, req.user.id);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Filter accounts', [RoleEnum.admin])
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async filter(@Query() query: FilterAccountsAdminDto): Promise<AccountDto[]> {
    return this.accountsService.filter(
      query.userId,
      query.label,
      query.status,
      query.accountId,
    );
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get accounts by user ID', [RoleEnum.admin])
  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findAllByUserId(
    @Param() params: AccountUserIdParamDto,
  ): Promise<AccountDto[]> {
    return this.accountsService.findAllByUserId(params.userId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Filter accounts by user ID', [RoleEnum.admin])
  @Get('user/:userId/filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async filterByUser(
    @Param() params: AccountUserIdParamDto,
    @Query() query: FilterAccountsDto,
  ): Promise<AccountDto[]> {
    return this.accountsService.filter(
      params.userId,
      query.label,
      query.status,
      query.accountId,
    );
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get account By name', [RoleEnum.admin])
  @Get('name/:name')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findByName(
    @Param() params: AccountAccountNameParamDto,
  ): Promise<AccountDto | null> {
    return this.accountsService.findByName(params.name);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get active accounts', [RoleEnum.admin])
  @Get('actives')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findActives(@Query('userId') userId?: number): Promise<AccountDto[]> {
    return this.accountsService.findActives(userId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Count accounts', [RoleEnum.admin])
  @Get('count')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Number })
  countAll(@Query('userId') userId?: number) {
    return this.accountsService.countAll(userId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Count active accounts', [RoleEnum.admin])
  @Get('count/actives')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: Number })
  countActives(@Query('userId') userId?: number) {
    return this.accountsService.countActives(userId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Find accounts by user social ID', [RoleEnum.admin])
  @Get('social/:socialId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto, isArray: true })
  async findAllBySocialId(
    @Param() params: AccountSocialIdParamDto,
  ): Promise<AccountDto[]> {
    return this.accountsService.findByUserSocialId(params.socialId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Find account by provider account ID', [RoleEnum.admin])
  @Get('providers/:accountId')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto })
  async findByAccountId(
    @Param() params: AccountAccountIdParamDto,
  ): Promise<AccountDto | null> {
    return this.accountsService.findByAccountId(params.accountId);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get account by ID', [RoleEnum.admin])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto })
  async findById(
    @Param() params: AccountIdParamDto,
  ): Promise<AccountDto | null> {
    return this.accountsService.findById(params.id);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update account by ID', [RoleEnum.admin])
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccountDto })
  @DisabledEndpoint({ markDeprecated: true })
  async update(
    @Param() params: AccountIdParamDto,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountDto | null> {
    return this.accountsService.update(params.id, updateAccountDto);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Delete account by ID', [RoleEnum.admin])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param() params: AccountIdParamDto): Promise<void> {
    await this.accountsService.remove(params.id);
  }
}
