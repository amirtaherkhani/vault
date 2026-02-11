import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { AuthAppleService } from './auth-apple.service';
import { AuthAppleLoginDto } from './dto/auth-apple-login.dto';
import { LoginResponseDto } from '../auth/dto/login-response.dto';
import { SerializeGroups } from '../utils/transformers/enum.transformer';
import { RoleEnum } from '../roles/roles.enum';
import { extractSessionMetadata } from '../session/utils/session-metadata';

@ApiTags('Auth')
@Controller({
  path: 'auth/apple',
  version: '1',
})
export class AuthAppleController {
  constructor(
    private readonly authService: AuthService,
    private readonly authAppleService: AuthAppleService,
  ) {}

  @ApiOkResponse({
    type: LoginResponseDto,
  })
  @SerializeOptions(SerializeGroups([RoleEnum.user]))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: AuthAppleLoginDto,
    @Headers() headers: Record<string, string | string[] | undefined>,
  ): Promise<LoginResponseDto> {
    const socialData = await this.authAppleService.getProfileByToken(loginDto);

    return this.authService.validateSocialLogin(
      'apple',
      socialData,
      undefined,
      extractSessionMetadata(headers),
    );
  }
}
