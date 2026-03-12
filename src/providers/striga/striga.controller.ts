import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Request,
  SerializeOptions,
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
import { SerializeGroups } from '../../utils/transformers/enum.transformer';
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
  StrigaUpdateCredentialsForAdminDto,
  StrigaUpdateUserForMeDto,
} from './dto/striga-user-update.dto';
import { StrigaKycTotalStatusDto } from './dto/striga-kyc-status.dto';
import {
  StrigaStartKycForAdminDto,
  StrigaStartKycForMeDto,
  StrigaStartKycResponseDto,
} from './dto/striga-start-kyc.dto';
import { StrigaUserExistsGuard } from './guards/striga-user-exists.guard';
import { UserKycService } from './services/striga-kyc.service';
import { StrigaUser } from './striga-users/domain/striga-user';
import { StrigaService } from './striga.service';
import { StrigaTransactionService } from './services/striga-transaction.service';
import {
  StrigaAccountStatementByAssetForAdminDto,
  StrigaAccountStatementByAssetForMeDto,
  StrigaAccountStatementByIdForAdminDto,
  StrigaAccountStatementByIdForMeDto,
  StrigaCardStatementForAdminDto,
  StrigaCardStatementForMeDto,
} from './striga-cards/dto/striga-card-transaction.dto';
import { StrigaBaseResponseDto } from './dto/striga-base.response.dto';

@ResponseModel('STRIGA')
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('striga.enable')
@RequireServiceReady(StrigaService)
@ApiBearerAuth()
@ApiTags('Striga')
@SerializeOptions(SerializeGroups([RoleEnum.admin, RoleEnum.user]))
@Controller({ path: '', version: '1' })
export class StrigaController {
  constructor(
    private readonly userKycService: UserKycService,
    private readonly strigaTransactionService: StrigaTransactionService,
  ) {}

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
    return this.userKycService.verifyEmailForMe(req, body);
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
    return this.userKycService.resendEmailForMe(req);
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
    return this.userKycService.verifyMobileForMe(req, body);
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
    return this.userKycService.resendMobileForMe(req);
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
    return this.userKycService.updateUserForMe(req, body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update user phone, address or birth date by Striga Id', [
    RoleEnum.admin,
  ])
  @Patch('users')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaUpdateUserForAdminDto })
  @ApiOkResponse({ type: StrigaUser })
  async updateUserForAdmin(
    @Body() body: StrigaUpdateUserForAdminDto,
  ): Promise<StrigaUser> {
    return this.userKycService.updateUserForAdmin(body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Update user verified credentials by Striga Id', [
    RoleEnum.admin,
  ])
  @Patch('users/verified-credentials')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaUpdateCredentialsForAdminDto })
  @ApiOkResponse({ type: StrigaUser })
  async updateVerifiedCredentialsForAdmin(
    @Body() body: StrigaUpdateCredentialsForAdminDto,
  ): Promise<StrigaUser> {
    return this.userKycService.updateVerifiedCredentialsForAdmin(body);
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
    return this.userKycService.findKycTotalStatusForMe(req);
  }

  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Start KYC for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('users/me/kyc/start')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaStartKycForMeDto })
  @ApiOkResponse({ type: StrigaStartKycResponseDto })
  async startKycForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaStartKycForMeDto,
  ): Promise<StrigaStartKycResponseDto> {
    return this.userKycService.startKycForMe(req, body);
  }

  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Start KYC by app user Id', [RoleEnum.admin])
  @Post('users/kyc/start')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: StrigaStartKycForAdminDto })
  @ApiOkResponse({ type: StrigaStartKycResponseDto })
  async startKycForAdmin(
    @Body() body: StrigaStartKycForAdminDto,
  ): Promise<StrigaStartKycResponseDto> {
    return this.userKycService.startKycForAdmin(body);
  }

  // Transactions - account by id (current user)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get account statement by accountId for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('transactions/accounts/me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findAccountStatementForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaAccountStatementByIdForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findAccountStatementForMe(
      req,
      body,
    );
  }

  // Transactions - account by id (admin)
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get account statement by accountId', [RoleEnum.admin])
  @Post('transactions/accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findAccountStatementForAdmin(
    @Body() body: StrigaAccountStatementByIdForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findAccountStatementForAdmin(
      body,
    );
  }

  // Transactions - account by currency (current user)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get account statement by currency for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('transactions/accounts/me/asset')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findAccountStatementByAssetForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaAccountStatementByAssetForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findAccountStatementByAssetForMe(
      req,
      body,
    );
  }

  // Transactions - account by currency (admin)
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get account statement by currency', [RoleEnum.admin])
  @Post('transactions/accounts/asset')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findAccountStatementByAssetForAdmin(
    @Body() body: StrigaAccountStatementByAssetForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findAccountStatementByAssetForAdmin(
      body,
    );
  }

  // Transactions - card statement (current user)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperationRoles('Get card statement for current user', [
    RoleEnum.admin,
    RoleEnum.user,
  ])
  @RequireStrigaUser()
  @UseGuards(StrigaUserExistsGuard)
  @Post('transactions/cards/me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findCardStatementForMe(
    @Request() req: RequestWithUser,
    @Body() body: StrigaCardStatementForMeDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findCardStatementForMe(
      req,
      body,
    );
  }

  // Transactions - card statement (admin)
  @Roles(RoleEnum.admin)
  @ApiOperationRoles('Get card statement', [RoleEnum.admin])
  @Post('transactions/cards')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: StrigaBaseResponseDto })
  async findCardStatementForAdmin(
    @Body() body: StrigaCardStatementForAdminDto,
  ): Promise<StrigaBaseResponseDto> {
    return await this.strigaTransactionService.findCardStatementForAdmin(body);
  }
}
