import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DynamicAuthGuard } from '../../auth/guards/dynamic-auth.guard';
import { ResponseModel } from '../../common/api-gateway/response/decorators/response-model.decorator';
import { EnableGuard } from '../../common/guards/service-enabled.guard';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import { ApiOperationRoles } from '../../utils/decorators/swagger.decorator';
import {
  RequireEnabled,
  RequireServiceReady,
} from '../../utils/decorators/service-toggleable.decorators';
import { RequireStrigaUser } from './decorators/striga-access.decorator';
import { StrigaBaseResponseDto } from './dto/striga-base.response.dto';
import {
  StrigaExternalIdRequestDto,
  StrigaGetAllWalletsRequestDto,
  StrigaKycRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaUpdateUserRequestDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from './dto/striga-request.dto';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { StrigaService } from './striga.service';
import { StrigaRequestWithContext } from './types/striga-request-context.type';

@ResponseModel('STRIGA')
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('striga.enable')
@RequireServiceReady(StrigaService)
@ApiBearerAuth()
@ApiTags('Striga')
@Controller({ path: 'striga', version: '1' })
export class StrigaController {
  constructor(private readonly strigaService: StrigaService) {}

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Ping Striga API', [RoleEnum.admin])
  @ApiOkResponse({
    description: 'Striga ping response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Get('status')
  async ping(): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.ping();
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Verify Striga user email', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga verify email response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaVerifyEmailRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('users/email/verify')
  @UseGuards(StrigaUserExistsGuard)
  @RequireStrigaUser()
  async verifyEmail(
    @Body() payload: StrigaVerifyEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.verifyEmail(payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Resend Striga verification email', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga resend email response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaResendEmailRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('users/email/resend')
  @UseGuards(StrigaUserExistsGuard)
  @RequireStrigaUser()
  async resendEmail(
    @Body() payload: StrigaResendEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.resendEmail(payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Verify Striga user mobile', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga verify mobile response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaVerifyMobileRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('users/mobile/verify')
  @UseGuards(StrigaUserExistsGuard)
  @RequireStrigaUser()
  async verifyMobile(
    @Body() payload: StrigaVerifyMobileRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.verifyMobile(payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Resend Striga mobile verification SMS', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga resend SMS response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaResendSmsRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('users/mobile/resend')
  @UseGuards(StrigaUserExistsGuard)
  @RequireStrigaUser()
  async resendSms(
    @Body() payload: StrigaResendSmsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.resendSms(payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get current Striga user', [RoleEnum.admin, RoleEnum.user])
  @ApiOkResponse({
    description: 'Current Striga user profile',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Get('users/me')
  async getMyUserFromCloud(
    @Request() request: StrigaRequestWithContext,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.getMyUserFromCloud(request);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get Striga user by externalId', [RoleEnum.admin])
  @ApiOkResponse({
    description: 'Striga user profile by externalId',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaExternalIdRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('users')
  async getUserFromCloudByExternalId(
    @Body() payload: StrigaExternalIdRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.getUserFromCloudByExternalId(payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @RequireStrigaUser()
  @ApiOperationRoles('Update current Striga user phone/address', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga update user contact response for current user',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaUpdateUserRequestDto })
  @HttpCode(HttpStatus.OK)
  @Patch('me')
  @UseGuards(StrigaUserExistsGuard)
  async updateMyContact(
    @Request() request: StrigaRequestWithContext,
    @Body() payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.updateContactForCurrentUser(request, payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @RequireStrigaUser()
  @ApiOperationRoles('Start KYC for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga start KYC response for current user',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('me/kyc/start')
  @UseGuards(StrigaUserExistsGuard)
  async startMyKyc(
    @Request() request: StrigaRequestWithContext,
    @Body() payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.startKycForCurrentUser(request, payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Start KYC', [RoleEnum.admin, RoleEnum.user])
  @ApiOkResponse({
    description: 'Striga start KYC response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('users/kyc/start')
  async startKyc(
    @Body() payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.startKyc(payload);
  }
}
