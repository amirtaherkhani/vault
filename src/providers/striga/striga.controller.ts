import {
  Patch,
  Body,
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { DynamicAuthGuard } from '../../auth/guards/dynamic-auth.guard';
import { EnableGuard } from '../../common/guards/service-enabled.guard';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { RolesGuard } from '../../roles/roles.guard';
import {
  RequireEnabled,
  RequireServiceReady,
} from '../../utils/decorators/service-toggleable.decorators';
import { StrigaBaseResponseDto } from './dto/striga-base.response.dto';
import {
  StrigaCreateAccountRequestDto,
  StrigaCreateUserRequestDto,
  StrigaKycRequestDto,
  StrigaResendEmailRequestDto,
  StrigaResendSmsRequestDto,
  StrigaUpdateVerifiedCredentialsRequestDto,
  StrigaUpdateUserRequestDto,
  StrigaUserByEmailRequestDto,
  StrigaUserIdParamDto,
  StrigaVerifyEmailRequestDto,
  StrigaVerifyMobileRequestDto,
} from './dto/striga-request.dto';
import { StrigaService } from './striga.service';

@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('striga.enable')
@RequireServiceReady(StrigaService)
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@ApiTags('Striga')
@Controller({ path: 'striga', version: '1' })
export class StrigaController {
  constructor(private readonly strigaService: StrigaService) {}

  @ApiOperation({ summary: 'Ping Striga API' })
  @ApiOkResponse({
    description: 'Striga ping response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Get('ping')
  async ping(): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.ping();
  }

  @ApiOperation({ summary: 'Get Striga user by ID' })
  @ApiParam({
    name: 'userId',
    description: 'Unique user ID from Striga',
    example: '474f3a7b-eaf4-45f8-b548-b784a0ba008f',
  })
  @ApiOkResponse({
    description: 'Striga user details response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Get('user/:userId')
  async getUserById(
    @Param() params: StrigaUserIdParamDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.getUserById(params.userId);
  }

  @ApiOperation({ summary: 'Get Striga user by email' })
  @ApiOkResponse({
    description: 'Striga user by email response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaUserByEmailRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/get-by-email')
  async getUserByEmail(
    @Body() payload: StrigaUserByEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.getUserByEmail(payload);
  }

  @ApiOperation({ summary: 'Verify Striga user email' })
  @ApiOkResponse({
    description: 'Striga verify email response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaVerifyEmailRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/verify-email')
  async verifyEmail(
    @Body() payload: StrigaVerifyEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.verifyEmail(payload);
  }

  @ApiOperation({ summary: 'Resend Striga verification email' })
  @ApiOkResponse({
    description: 'Striga resend email response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaResendEmailRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/resend-email')
  async resendEmail(
    @Body() payload: StrigaResendEmailRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.resendEmail(payload);
  }

  @ApiOperation({ summary: 'Verify Striga user mobile' })
  @ApiOkResponse({
    description: 'Striga verify mobile response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaVerifyMobileRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/verify-mobile')
  async verifyMobile(
    @Body() payload: StrigaVerifyMobileRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.verifyMobile(payload);
  }

  @ApiOperation({ summary: 'Resend Striga mobile verification SMS' })
  @ApiOkResponse({
    description: 'Striga resend SMS response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaResendSmsRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/resend-sms')
  async resendSms(
    @Body() payload: StrigaResendSmsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.resendSms(payload);
  }

  @ApiOperation({ summary: 'Create Striga user' })
  @ApiOkResponse({
    description: 'Striga create user response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaCreateUserRequestDto })
  @HttpCode(HttpStatus.OK)
  @Post('user/create')
  async createUser(
    @Body() payload: StrigaCreateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.createUser(payload);
  }

  @ApiOperation({ summary: 'Create account' })
  @ApiOkResponse({
    description: 'Striga create account response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('account/create')
  async createAccount(
    @Body() payload: StrigaCreateAccountRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.createAccount(payload);
  }

  @ApiOperation({ summary: 'Update Striga user' })
  @ApiOkResponse({
    description: 'Striga update user response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaUpdateUserRequestDto })
  @HttpCode(HttpStatus.OK)
  @Patch('user/update')
  async updateUser(
    @Body() payload: StrigaUpdateUserRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.updateUser(payload);
  }

  @ApiOperation({ summary: 'Update Striga verified credentials' })
  @ApiOkResponse({
    description: 'Striga update verified credentials response',
    type: StrigaBaseResponseDto,
  })
  @ApiBody({ type: StrigaUpdateVerifiedCredentialsRequestDto })
  @HttpCode(HttpStatus.OK)
  @Patch('user/update-verified-credentials')
  async updateVerifiedCredentials(
    @Body() payload: StrigaUpdateVerifiedCredentialsRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return this.strigaService.updateVerifiedCredentials(payload);
  }

  @ApiOperation({ summary: 'Initialize KYC' })
  @ApiOkResponse({
    description: 'Striga init KYC response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('kyc/init')
  async initKyc(
    @Body() payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.initKyc(payload);
  }

  @Roles(RoleEnum.user)
  @ApiOperation({ summary: 'Start KYC' })
  @ApiOkResponse({
    description: 'Striga start KYC response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('kyc/start')
  async startKyc(
    @Body() payload: StrigaKycRequestDto,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.startKyc(payload);
  }
}
