import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthVeroService } from './auth-vero.service';
import { AuthVeroLoginDto } from './dto/auth-vero-login.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { AuthVeroCreateDto } from './dto/auth-vero-create.dto';
import { AuthVeroBulkCreateDto } from './dto/auth-vero-bulk-create.dto';
import { AuthVeroBulkUpdateDto } from './dto/auth-vero-bulk-update.dto';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { User } from '../users/domain/user';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';

@ApiTags('Auth')
@Controller({
  path: 'auth/vero',
  version: '1',
})
export class AuthVeroController {
  constructor(
    private readonly authService: AuthService,
    private readonly authVeroService: AuthVeroService,
  ) {}

  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @SerializeOptions({
    groups: ['me'],
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthVeroLoginDto): Promise<LoginResponseDto> {
    if (this.authVeroService.isExternalTokenMode()) {
      return this.authVeroService.loginWithExternalToken(loginDto);
    }
    const { profile, exp } =
      await this.authVeroService.getProfileByToken(loginDto);
    return this.authService.validateSocialLogin(
      AuthProvidersEnum.vero,
      profile,
      exp,
    );
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(DynamicAuthGuard, RolesGuard)
  @ApiCreatedResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createDto: AuthVeroCreateDto): Promise<User> {
    return this.authVeroService.createUser(createDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(DynamicAuthGuard, RolesGuard)
  @ApiCreatedResponse({
    type: User,
    isArray: true,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post('/register/bulk')
  @HttpCode(HttpStatus.CREATED)
  bulkCreateUsers(
    @Body() bulkCreateDto: AuthVeroBulkCreateDto,
  ): Promise<User[]> {
    return this.authVeroService.bulkCreateUsers(bulkCreateDto);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(DynamicAuthGuard, RolesGuard)
  @ApiOkResponse({
    type: User,
    isArray: true,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch('/users/bulk')
  @HttpCode(HttpStatus.OK)
  bulkUpdateUsers(
    @Body() bulkUpdateDto: AuthVeroBulkUpdateDto,
  ): Promise<User[]> {
    return this.authVeroService.bulkUpdateUsers(bulkUpdateDto);
  }
}
