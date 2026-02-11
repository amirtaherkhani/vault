import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SessionService } from './session.service';
import { SessionDto } from './dto/session.dto';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';
import { AuthService } from '../auth/auth.service';
import { RefreshResponseDto } from '../auth/dto/refresh-response.dto';
import { SessionRequest } from './types/session-base.type';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller({
  path: 'sessions',
  version: '1',
})
export class SessionsController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly authService: AuthService,
  ) {}

  @ApiOkResponse({
    type: SessionDto,
    isArray: true,
  })
  @UseGuards(DynamicAuthGuard)
  @Get()
  list(
    @Request() request: SessionRequest,
    @Query('activeWithinDays') activeWithinDays?: string,
  ): Promise<SessionDto[]> {
    return this.sessionService.listForUserWithActivityFilter(
      request.user,
      activeWithinDays,
    );
  }

  @UseGuards(DynamicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(
    @Param('id') id: string,
    @Request() request: SessionRequest,
  ): Promise<void> {
    await this.sessionService.deleteOneForUser(request.user, id);
  }

  @UseGuards(DynamicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(
    @Request() request: SessionRequest,
    @Query('includeCurrent') includeCurrent?: string,
  ): Promise<void> {
    await this.sessionService.deleteAllForUser(request.user, includeCurrent);
  }

  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Request() request: SessionRequest): Promise<RefreshResponseDto> {
    return this.authService.refreshTokenFromUser(request.user);
  }
}
