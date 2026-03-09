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
import { Body, Post } from '@nestjs/common';
import { StrigaUserExistsGuard } from '../guards/striga-user-exists.guard';

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
}
