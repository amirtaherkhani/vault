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
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiTags } from '@nestjs/swagger';
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
import { RequestWithUser } from '../../utils/types/object.type';
import { RequireStrigaUser } from './decorators/striga-access.decorator';
import {
  StrigaVerificationAcceptedDto,
  StrigaVerificationActionDto,
  StrigaVerifyEmailForMeDto,
  StrigaVerifyMobileForMeDto,
} from './dto/striga-verification.dto';
import {
  StrigaUpdateUserForAdminDto,
  StrigaUpdateUserForMeDto,
} from './dto/striga-user-update.dto';
import { StrigaKycTotalStatusDto } from './dto/striga-kyc-status.dto';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { StrigaUserService } from './services/striga-kyc.service';
import { StrigaUser } from './striga-users/domain/striga-user';
import { StrigaService } from './striga.service';

@ResponseModel('STRIGA')
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('striga.enable')
@RequireServiceReady(StrigaService)
@ApiBearerAuth()
@ApiTags('Striga')
@Controller({ path: '', version: '1' })
export class StrigaController {
  constructor(private readonly strigaUserService: StrigaUserService) {}

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Verify current user email', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('users/me/email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaVerificationAcceptedDto })
  async verifyEmailForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaVerifyEmailForMeDto,
  ): Promise<StrigaVerificationAcceptedDto> {
    return this.strigaUserService.verifyEmailForMe(req, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Resend current user email verification code', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('users/me/email/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaVerificationAcceptedDto })
  async resendEmailForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaVerificationAcceptedDto> {
    return this.strigaUserService.resendEmailForMe(req);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Verify current user mobile', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('users/mobile/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaVerificationActionDto })
  async verifyMobileForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaVerifyMobileForMeDto,
  ): Promise<StrigaVerificationActionDto> {
    return this.strigaUserService.verifyMobileForMe(req.user?.id, body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Resend current user mobile verification code', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('users/mobile/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaVerificationActionDto })
  async resendMobileForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaVerificationActionDto> {
    return this.strigaUserService.resendMobileForMe(req.user?.id);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Update current user phone, address or birth date', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Patch('users/me')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaUpdateUserForMeDto })
  @ApiOkResponse({ type: StrigaUser })
  async updateUserForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaUpdateUserForMeDto,
  ): Promise<StrigaUser> {
    return this.strigaUserService.updateUserForMe(req, body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update user phone, address or birth date by Striga ID', [
    RoleEnum.admin,
  ])
  @Patch('users')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaUpdateUserForAdminDto })
  @ApiOkResponse({ type: StrigaUser })
  async updateUserForAdmin(
    @Body() body: StrigaUpdateUserForAdminDto,
  ): Promise<StrigaUser> {
    return this.strigaUserService.updateUserForAdmin(body);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get total KYC status for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Get('users/me/kyc/status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaKycTotalStatusDto })
  async findKycTotalStatusForMe(
    @Request() req: RequestWithUser,
  ): Promise<StrigaKycTotalStatusDto> {
    return this.strigaUserService.findKycTotalStatusForMe(req);
  }
}
