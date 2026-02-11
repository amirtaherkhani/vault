import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FireblocksCwClientService } from '../services/fireblocks-cw-client.service';
import {
  CreateUserVaultRequestDto,
  CreateVaultWalletRequestDto,
  CreateUserVaultAssetRequestDto,
  CreateUserVaultAddressRequestDto,
  EnsureUserWalletDto,
  VaultAccountAssetParamDto,
  VaultAccountParamDto,
} from '../dto/fireblocks-cw-requests.dto';
import {
  FireblocksCustodialWalletDto,
  FireblocksVaultAccountDto,
  FireblocksVaultAssetDto,
} from '../dto/fireblocks-cw-responses.dto';
import { RequestWithUser } from '../../../../utils/types/object.type';
import { RolesGuard } from '../../../../roles/roles.guard';
import { Roles } from '../../../../roles/roles.decorator';
import { RoleEnum } from '../../../../roles/roles.enum';
import { ApiOperationRoles } from '../../../../utils/decorators/swagger.decorator';
import {
  RequireEnabled,
  RequireServiceReady,
} from '../../../../utils/decorators/service-toggleable.decorators';
import { EnableGuard } from '../../../../common/guards/service-enabled.guard';
import { FireblocksCwService } from '../fireblocks-cw.service';
import { DynamicAuthGuard } from '../../../../auth/guards/dynamic-auth.guard';

@ApiTags('Fireblocks CW [SERVICES-CLIENT]')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('fireblocks.enable')
@RequireServiceReady(FireblocksCwService)
@Controller({ path: 'vaults', version: '1' })
@Roles(RoleEnum.admin, RoleEnum.user)
export class FireblocksCwClientController {
  constructor(private readonly client: FireblocksCwClientService) {}

  @Get('me/accounts')
  @ApiOkResponse({ type: FireblocksVaultAccountDto, isArray: true })
  @ApiOperationRoles('List Fireblocks vault accounts for the current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  listMyVaultAccounts(
    @Request() req: RequestWithUser,
  ): Promise<FireblocksVaultAccountDto[]> {
    return this.client.listUserVaultAccounts(req.user.id);
  }

  @Post('me/accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FireblocksVaultAccountDto })
  @ApiOperationRoles('Create Fireblocks vault account for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  createMyVaultAccount(
    @Request() req: RequestWithUser,
    @Body() body: CreateUserVaultRequestDto,
  ): Promise<FireblocksVaultAccountDto> {
    return this.client.createVaultAccountForUser(req.user, body);
  }

  @Get('me/wallets')
  @ApiOkResponse({ type: FireblocksCustodialWalletDto, isArray: true })
  @ApiOperationRoles('List all Fireblocks vault wallets for the current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  listMyVaultWallets(
    @Request() req: RequestWithUser,
  ): Promise<FireblocksCustodialWalletDto[]> {
    return this.client.listUserVaultWallets(req.user);
  }

  @Get('me/accounts/:vaultAccountId/wallets')
  @ApiParam({
    name: 'vaultAccountId',
    description: 'Target vault account id',
  })
  @ApiOkResponse({ type: FireblocksCustodialWalletDto, isArray: true })
  @ApiOperationRoles(
    'List wallets within a specific Fireblocks vault account for the current user',
    [RoleEnum.admin, RoleEnum.user],
  )
  listMyVaultAccountWallets(
    @Request() req: RequestWithUser,
    @Param() params: VaultAccountParamDto,
  ): Promise<FireblocksCustodialWalletDto[]> {
    return this.client.listUserVaultAccountWallets(
      req.user,
      `${params.vaultAccountId}`,
    );
  }

  @Post('me/accounts/:vaultAccountId/wallets')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FireblocksVaultAssetDto })
  @ApiOperationRoles(
    'Create a wallet under an existing Fireblocks vault account for current user',
    [RoleEnum.admin, RoleEnum.user],
  )
  createMyVaultWallet(
    @Request() req: RequestWithUser,
    @Param() params: VaultAccountParamDto,
    @Body() body: CreateUserVaultAssetRequestDto,
  ): Promise<FireblocksVaultAssetDto> {
    return this.client.createVaultAssetForUser(
      req.user,
      `${params.vaultAccountId}`,
      body,
    );
  }

  @Get('me/accounts/:vaultAccountId/wallets/:assetId')
  @ApiParam({
    name: 'vaultAccountId',
    description: 'Target vault account id',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Asset identifier within the vault account',
  })
  @ApiOkResponse({ type: FireblocksCustodialWalletDto })
  @ApiOperationRoles(
    'Fetch a specific wallet in a Fireblocks vault account for the current user',
    [RoleEnum.admin, RoleEnum.user],
  )
  getMyVaultAccountWallet(
    @Request() req: RequestWithUser,
    @Param() params: VaultAccountAssetParamDto,
  ): Promise<FireblocksCustodialWalletDto> {
    return this.client.getUserVaultAccountWallet(
      req.user,
      `${params.vaultAccountId}`,
      params.assetId,
    );
  }

  @Post('me/accounts/:vaultAccountId/wallets/:assetId/addresses')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FireblocksCustodialWalletDto })
  @ApiOperationRoles(
    'Create or ensure a deposit address for a specific wallet',
    [RoleEnum.admin, RoleEnum.user],
  )
  createMyWalletAddress(
    @Request() req: RequestWithUser,
    @Param() params: VaultAccountAssetParamDto,
    @Body() body: CreateUserVaultAddressRequestDto,
  ): Promise<FireblocksCustodialWalletDto> {
    return this.client.createVaultWalletAddressForUser(
      req.user,
      `${params.vaultAccountId}`,
      params.assetId,
      body,
    );
  }

  @Post('me/wallets')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: FireblocksCustodialWalletDto })
  @ApiOperationRoles('Create a Fireblocks vault wallet for a current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  createVaultWallet(
    @Request() req: RequestWithUser,
    @Body() command: CreateVaultWalletRequestDto,
  ): Promise<FireblocksCustodialWalletDto> {
    const payload: CreateVaultWalletRequestDto = {
      ...command,
      customerRefId: command.customerRefId ?? `${req.user.id}`,
    };
    return this.client.createWallet(payload);
  }

  @Post('me/wallets/ensure')
  @ApiOkResponse({ type: FireblocksCustodialWalletDto })
  @ApiOperationRoles(
    'Ensure the vault wallet and deposit address for a current user',
    [RoleEnum.admin, RoleEnum.user],
  )
  ensureUserWallet(
    @Request() req: RequestWithUser,
    @Body() command: EnsureUserWalletDto,
  ): Promise<FireblocksCustodialWalletDto> {
    return this.client.ensureUserWallet(req.user, command.assetId);
  }
}
