import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
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

  @ApiOperation({ summary: 'Create Striga user' })
  @ApiOkResponse({
    description: 'Striga create user response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('user/create')
  async createUser(
    @Body() payload: Record<string, unknown>,
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
    @Body() payload: Record<string, unknown>,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.createAccount(payload);
  }

  @ApiOperation({ summary: 'Initialize KYC' })
  @ApiOkResponse({
    description: 'Striga init KYC response',
    type: StrigaBaseResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  @Post('kyc/init')
  async initKyc(
    @Body() payload: Record<string, unknown>,
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
    @Body() payload: Record<string, unknown>,
  ): Promise<StrigaBaseResponseDto<any>> {
    return await this.strigaService.startKyc(payload);
  }
}
