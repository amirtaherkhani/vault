import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import {
  RequireStrigaKycApproved,
  RequireStrigaUser,
} from './decorators/striga-access.decorator';
import { StrigaBaseResponseDto } from './dto/striga-base.response.dto';
import { StrigaUserKycStatusResponseDto } from './dto/striga-kyc.response.dto';
import {
  StrigaGetAllWalletsRequestDto,
  StrigaKycRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from './dto/striga-request.dto';
import { StrigaKycApprovedGuard } from './guards/striga-kyc-approved.guard';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { StrigaService } from './striga.service';
import { StrigaRequestWithContext } from './types/striga-request-context.type';

@ResponseModel('STRIGA')
@UseGuards(
  DynamicAuthGuard,
  RolesGuard,
  EnableGuard,
  StrigaUserExistsGuard,
  StrigaKycApprovedGuard,
)
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
  async resendSms(
    @Body() payload: StrigaResendSmsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.resendSms(payload);
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
  async startMyKyc(
    @Request() request: StrigaRequestWithContext,
    @Body() payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.startKycForCurrentUser(request, payload);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @RequireStrigaKycApproved()
  @ApiOperationRoles('List Striga wallets for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @ApiOkResponse({
    description: 'Striga wallets response for current user',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('me/wallets/list')
  async getMyWallets(
    @Request() request: StrigaRequestWithContext,
    @Body() payload: StrigaGetAllWalletsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.getWalletsForCurrentUser(request, payload);
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
