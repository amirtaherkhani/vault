import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Request,
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
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../../../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../../../utils/infinity-pagination';
import { RequestWithUser } from '../../../utils/types/object.type';
import {
  StrigaUser,
  StrigaUserAddress,
  StrigaUserKyc,
  StrigaUserMobile,
} from './domain/striga-user';
import { FindAllStrigaUsersDto } from './dto/find-all-striga-users.dto';
import {
  FilterStrigaUsersDto,
  StrigaUsersByIdsQueryDto,
} from './dto/query-striga-user.dto';
import { StrigaUsersService } from './striga-users.service';

@RequireEnabled('striga.enable')
@ApiTags('Striga')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@Controller({
  path: 'striga/users',
  version: '1',
})
export class StrigaUsersController {
  constructor(private readonly strigaUsersService: StrigaUsersService) {}

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current Striga user info', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUser })
  async findByMe(@Request() req: RequestWithUser): Promise<StrigaUser | null> {
    return this.strigaUsersService.resolveStrigaUserForMe(req.user?.id);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current Striga user phone', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/phone')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUserMobile })
  async findPhoneForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaUserMobile | null> {
    const strigaUser = await this.strigaUsersService.resolveStrigaUserForMe(
      req.user?.id,
    );
    if (!strigaUser?.externalId) {
      return null;
    }

    return this.strigaUsersService.findPhone(undefined, strigaUser.externalId);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current Striga user address', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/address')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUserAddress })
  async findAddressForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaUserAddress | null> {
    const strigaUser = await this.strigaUsersService.resolveStrigaUserForMe(
      req.user?.id,
    );
    if (!strigaUser?.externalId) {
      return null;
    }

    return this.strigaUsersService.findAddress(
      undefined,
      strigaUser.externalId,
    );
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current Striga user KYC', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @Get('me/kyc')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUserKyc })
  async findKycForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaUserKyc | null> {
    const strigaUser = await this.strigaUsersService.resolveStrigaUserForMe(
      req.user?.id,
    );
    if (!strigaUser?.externalId) {
      return null;
    }

    return (
      (await this.strigaUsersService.findKyc(
        undefined,
        strigaUser.externalId,
      )) ?? null
    );
  }

  // ---------------------------------------------------------------------------
  // Admin routes (static paths)
  // ---------------------------------------------------------------------------
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Filter Striga users', [RoleEnum.admin])
  @Get('filter')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUser, isArray: true })
  async filter(@Query() query: FilterStrigaUsersDto): Promise<StrigaUser[]> {
    return await this.strigaUsersService.filter(
      query.externalId,
      query.email,
      query.firstName,
      query.lastName,
    );
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get Striga users by local IDs', [RoleEnum.admin])
  @Get('ids')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaUser, isArray: true })
  async findByIds(
    @Query() query: StrigaUsersByIdsQueryDto,
  ): Promise<StrigaUser[]> {
    return this.strigaUsersService.findByIds(query.ids);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('List Striga users with pagination', [RoleEnum.admin])
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: InfinityPaginationResponse(StrigaUser),
  })
  async findAll(
    @Query() query: FindAllStrigaUsersDto,
  ): Promise<InfinityPaginationResponseDto<StrigaUser>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.strigaUsersService.findAllWithPagination({
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get Striga user by local ID', [RoleEnum.admin])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({ type: StrigaUser })
  async findById(@Param('id') id: string): Promise<StrigaUser | null> {
    return this.strigaUsersService.findById(id);
  }
}
