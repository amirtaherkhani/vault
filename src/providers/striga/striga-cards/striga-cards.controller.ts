import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DynamicAuthGuard } from '../../../auth/guards/dynamic-auth.guard';
import { EnableGuard } from '../../../common/guards/service-enabled.guard';
import { Roles } from '../../../roles/roles.decorator';
import { RoleEnum } from '../../../roles/roles.enum';
import { RolesGuard } from '../../../roles/roles.guard';
import { ApiOperationRoles } from '../../../utils/decorators/swagger.decorator';
import { RequireEnabled } from '../../../utils/decorators/service-toggleable.decorators';
import { SerializeGroups } from '../../../utils/transformers/enum.transformer';
import { RequestWithUser } from '../../../utils/types/object.type';
import { StrigaCardsService } from './striga-cards.service';
import { StrigaCard } from './domain/striga-card';
import {
  FilterStrigaCardsDto,
  StrigaCardCurrencyParamDto,
  StrigaCardIdParamDto,
} from './dto/query-striga-card.dto';
import {
  StrigaCardPinResultDto,
  StrigaSetCardPinForAdminDto,
  StrigaSetCardPinForMeDto,
} from './dto/striga-card-pin.dto';
import {
  StrigaCardFreezeStateDto,
  StrigaCardFreezeStatusDto,
  StrigaToggleCardFreezeForAdminDto,
  StrigaToggleCardFreezeForMeDto,
} from './dto/striga-card-freeze.dto';
import { Body, Post, Patch } from '@nestjs/common';
import { StrigaUserExistsGuard } from '../guards/striga-user-exists.guard';
import {
  StrigaUpdateCardSecurityForAdminDto,
  StrigaUpdateCardSecurityForMeDto,
  StrigaUpdateCardSecurityResultDto,
} from './dto/striga-card-security.dto';
import {
  StrigaUpdateCardLimitsForAdminDto,
  StrigaUpdateCardLimitsForMeDto,
  StrigaUpdateCardLimitsResultDto,
  StrigaResetCardLimitsForAdminDto,
  StrigaResetCardLimitsForMeDto,
} from './dto/striga-card-limits.dto';

@RequireEnabled('striga.enable')
@ApiTags('Striga')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@SerializeOptions(SerializeGroups([RoleEnum.admin, RoleEnum.user]))
@Controller({
  path: 'striga/cards',
  version: '1',
})
export class StrigaCardsController {
  constructor(private readonly strigaCardsService: StrigaCardsService) {}

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current user Striga cards', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me')
  @ApiOkResponse({ type: StrigaCard, isArray: true })
  async findCardsForMe(
    @Request() req: RequestWithUser,
    @Query() query: FilterStrigaCardsDto,
  ): Promise<StrigaCard[]> {
    return await this.strigaCardsService.findCardsForMe(req, {
      status: query.status,
      linkedAccountCurrency: query.linkedAccountCurrency as any,
      parentWalletId: query.parentWalletId,
    });
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current user Striga card by currency', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/currency/:currency')
  @ApiOkResponse({ type: StrigaCard })
  async findCardByCurrencyForMe(
    @Request() req: RequestWithUser,
    @Param() params: StrigaCardCurrencyParamDto,
  ): Promise<StrigaCard | null> {
    return await this.strigaCardsService.findCardByCurrencyForMe(
      req,
      params.currency,
    );
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Set PIN for current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Post('me/settings/pin')
  @ApiOkResponse({ type: StrigaCardPinResultDto })
  async setCardPinForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaSetCardPinForMeDto,
  ): Promise<StrigaCardPinResultDto> {
    return await this.strigaCardsService.setCardPinForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Update security for current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/security')
  @ApiOkResponse({ type: StrigaUpdateCardSecurityResultDto })
  async updateCardSecurityForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaUpdateCardSecurityForMeDto,
  ): Promise<StrigaUpdateCardSecurityResultDto> {
    return await this.strigaCardsService.updateCardSecurityForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Update spending limits for current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/limits')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async updateCardLimitsForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaUpdateCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.updateCardLimitsForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles(
    'Disable spending limits (set to zero) for current user Striga card',
    [RoleEnum.admin, RoleEnum.user],
  )
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/limits/reset')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetCardLimitsForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaUpdateCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetCardLimitsForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Disable withdrawal limits for current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/limits/reset/withdrawals')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetWithdrawalLimitsForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetWithdrawalLimitsForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Disable purchase limits for current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/limits/reset/purchases')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetPurchaseLimitsForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetPurchaseLimitsForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles(
    'Disable per-transaction limits for current user Striga card',
    [RoleEnum.admin, RoleEnum.user],
  )
  @UseGuards(StrigaUserExistsGuard)
  @Patch('me/settings/limits/reset/transactions')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetTransactionLimitsForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaResetCardLimitsForMeDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetTransactionLimitsForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current user Striga card account by card id', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/:id/account')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({
    description: 'Striga account (wallet) record',
    type: Object,
  })
  async findCardAccountForMe(
    @Request() req: RequestWithUser,
    @Param() params: StrigaCardIdParamDto,
  ) {
    return await this.strigaCardsService.findCardAccountForMe(req, params.id);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current user Striga card by id', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/:id')
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: StrigaCard })
  async findCardForMe(
    @Request() req: RequestWithUser,
    @Param() params: StrigaCardIdParamDto,
  ): Promise<StrigaCard | null> {
    return await this.strigaCardsService.findCardForMe(req, params.id);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get Striga cards for app user', [RoleEnum.admin])
  @Get('user/:userId')
  @ApiParam({
    name: 'userId',
    type: Number,
    required: true,
    description: 'Application user Id',
  })
  @ApiOkResponse({ type: StrigaCard, isArray: true })
  async findCardsForUser(
    @Param('userId') userId: number,
    @Query() query: FilterStrigaCardsDto,
  ): Promise<StrigaCard[]> {
    return await this.strigaCardsService.findCardsForUserId(userId, {
      status: query.status,
      linkedAccountCurrency: query.linkedAccountCurrency as any,
      parentWalletId: query.parentWalletId,
    });
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get Striga card by local Id', [RoleEnum.admin])
  @Get(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: StrigaCard,
  })
  async findById(@Param('id') id: string) {
    return await this.strigaCardsService.findById(id);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Set PIN for user Striga card', [RoleEnum.admin])
  @Post('settings/pin')
  @ApiOkResponse({ type: StrigaCardPinResultDto })
  async setCardPinForAdmin(
    @Body() body: StrigaSetCardPinForAdminDto,
  ): Promise<StrigaCardPinResultDto> {
    return await this.strigaCardsService.setCardPinForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update security for user Striga card', [RoleEnum.admin])
  @Patch('settings/security')
  @ApiOkResponse({ type: StrigaUpdateCardSecurityResultDto })
  async updateCardSecurityForAdmin(
    @Body() body: StrigaUpdateCardSecurityForAdminDto,
  ): Promise<StrigaUpdateCardSecurityResultDto> {
    return await this.strigaCardsService.updateCardSecurityForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update spending limits for user Striga card', [
    RoleEnum.admin,
  ])
  @Patch('settings/limits')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async updateCardLimitsForAdmin(
    @Body() body: StrigaUpdateCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.updateCardLimitsForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Disable spending limits for user Striga card', [
    RoleEnum.admin,
  ])
  @Patch('settings/limits/reset')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetCardLimitsForAdmin(
    @Body() body: StrigaUpdateCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetCardLimitsForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Disable withdrawal limits for user Striga card', [
    RoleEnum.admin,
  ])
  @Patch('settings/limits/reset/withdrawals')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetWithdrawalLimitsForAdmin(
    @Body() body: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetWithdrawalLimitsForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Disable purchase limits for user Striga card', [
    RoleEnum.admin,
  ])
  @Patch('settings/limits/reset/purchases')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetPurchaseLimitsForAdmin(
    @Body() body: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetPurchaseLimitsForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Disable per-transaction limits for user Striga card', [
    RoleEnum.admin,
  ])
  @Patch('settings/limits/reset/transactions')
  @ApiOkResponse({ type: StrigaUpdateCardLimitsResultDto })
  async resetTransactionLimitsForAdmin(
    @Body() body: StrigaResetCardLimitsForAdminDto,
  ): Promise<StrigaUpdateCardLimitsResultDto> {
    return await this.strigaCardsService.resetTransactionLimitsForAdmin(body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Freeze/Unfreeze current user Striga card', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Post('me/settings/freeze')
  @ApiOkResponse({ type: StrigaCardFreezeStatusDto })
  async toggleCardFreezeForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaToggleCardFreezeForMeDto,
  ): Promise<StrigaCardFreezeStatusDto> {
    return await this.strigaCardsService.toggleCardFreezeForMe(req, body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Freeze/Unfreeze Striga card for user', [RoleEnum.admin])
  @Post('settings/freeze')
  @ApiOkResponse({ type: StrigaCardFreezeStatusDto })
  async toggleCardFreezeForAdmin(
    @Body() body: StrigaToggleCardFreezeForAdminDto,
  ): Promise<StrigaCardFreezeStatusDto> {
    return await this.strigaCardsService.toggleCardFreezeForAdmin(body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current user card freeze status', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @UseGuards(StrigaUserExistsGuard)
  @Get('me/:id/freeze')
  @ApiOkResponse({ type: StrigaCardFreezeStateDto })
  async getCardFreezeStateForMe(
    @Request() req: RequestWithUser,
    @Param() params: StrigaCardIdParamDto,
  ): Promise<StrigaCardFreezeStateDto> {
    return await this.strigaCardsService.getCardFreezeStateForMe(
      req,
      params.id,
    );
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get card freeze status (admin)', [RoleEnum.admin])
  @Get('user/:userId/:id/freeze')
  @ApiParam({ name: 'userId', type: Number, required: true })
  @ApiParam({ name: 'id', type: String, required: true })
  @ApiOkResponse({ type: StrigaCardFreezeStateDto })
  async getCardFreezeStateForAdmin(
    @Param('userId') userId: number,
    @Param('id') cardId: string,
  ): Promise<StrigaCardFreezeStateDto> {
    return await this.strigaCardsService.getCardFreezeStateForAdmin(
      userId,
      cardId,
    );
  }
}
