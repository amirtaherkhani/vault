import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
  SerializeOptions,
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
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { User } from '../users/domain/user';
import { AuthProvidersEnum } from '../auth/auth-providers.enum';
import {
  GroupPlainToInstance,
  GroupPlainToInstances,
} from '../utils/transformers/class.transformer';
import { SerializeGroups } from '../utils/transformers/enum.transformer';
import { GroupNames } from '../utils/types/role-groups-const.type';

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
  @SerializeOptions(SerializeGroups([GroupNames.me]))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthVeroLoginDto): Promise<LoginResponseDto> {
    const { profile, exp } =
      await this.authVeroService.getProfileByToken(loginDto);
    const result = await this.authService.validateSocialLogin(
      AuthProvidersEnum.vero,
      profile,
      exp,
    );
    return GroupPlainToInstance(LoginResponseDto, result, [GroupNames.me]);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiCreatedResponse({
    type: User,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createDto: AuthVeroCreateDto): Promise<User> {
    const result = await this.authVeroService.createUser(createDto);
    return GroupPlainToInstance(User, result, [RoleEnum.admin]);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiCreatedResponse({
    type: User,
    isArray: true,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Post('/register/bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateUsers(
    @Body() bulkCreateDto: AuthVeroBulkCreateDto,
  ): Promise<User[]> {
    const result = await this.authVeroService.bulkCreateUsers(bulkCreateDto);
    return GroupPlainToInstances(User, result, [RoleEnum.admin]);
  }

  @ApiBearerAuth()
  @Roles(RoleEnum.admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiOkResponse({
    type: User,
    isArray: true,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.admin]))
  @Patch('/users/bulk')
  @HttpCode(HttpStatus.OK)
  async bulkUpdateUsers(
    @Body() bulkUpdateDto: AuthVeroBulkUpdateDto,
  ): Promise<User[]> {
    const result = await this.authVeroService.bulkUpdateUsers(bulkUpdateDto);
    return GroupPlainToInstances(User, result, [RoleEnum.admin]);
  }
}
