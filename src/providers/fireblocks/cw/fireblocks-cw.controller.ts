import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FireblocksCwService } from './fireblocks-cw.service';
import { FireblocksCwStatusDto } from './dto/fireblocks-cw-responses.dto';
import { RolesGuard } from '../../../roles/roles.guard';
import { Roles } from '../../../roles/roles.decorator';
import { RoleEnum } from '../../../roles/roles.enum';
import { ApiOperationRoles } from '../../../utils/decorators/swagger.decorator';
import {
  RequireEnabled,
  RequireServiceReady,
} from '../../../utils/decorators/service-toggleable.decorators';
import { EnableGuard } from '../../../common/guards/service-enabled.guard';
import { DynamicAuthGuard } from '../../../auth/guards/dynamic-auth.guard';

@ApiTags('Fireblocks-CW')
@ApiBearerAuth()
@UseGuards(DynamicAuthGuard, RolesGuard, EnableGuard)
@RequireEnabled('fireblocks.enable')
@RequireServiceReady(FireblocksCwService)
@Controller({ version: '1' })
@Roles(RoleEnum.admin)
export class FireblocksCwBaseController {
  constructor(private readonly fireblocks: FireblocksCwService) {}

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: FireblocksCwStatusDto })
  @ApiOperationRoles('Get Fireblocks CW status', [RoleEnum.admin])
  getStatus(): FireblocksCwStatusDto {
    this.fireblocks.isReady();
    const options = this.fireblocks.getOptions();
    return {
      envType: options.envType,
      vaultNamePrefix: options.vaultNamePrefix,
      requestTimeoutMs: options.requestTimeoutMs,
      maxRetries: options.maxRetries,
      debugLogging: options.debugLogging,
      rateLimit: options.rateLimit,
      circuitBreaker: options.circuitBreaker,
    };
  }
}
