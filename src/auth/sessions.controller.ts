import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SessionService } from '../session/session.service';
import { SessionDto } from '../session/dto/session.dto';
import { DynamicAuthGuard } from './guards/dynamic-auth.guard';
import { AuthService } from './auth.service';
import { RefreshResponseDto } from './dto/refresh-response.dto';

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
  async list(@Request() request): Promise<SessionDto[]> {
    const userId = request.user?.id;
    const currentSessionId = request.user?.sessionId;
    const sessions = await this.sessionService.findByUserId({ userId });
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      current:
        currentSessionId !== undefined &&
        String(currentSessionId) === String(session.id),
    }));
  }

  @UseGuards(DynamicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string, @Request() request): Promise<void> {
    const session = await this.sessionService.findById(id);
    if (!session || String(session.user?.id) !== String(request.user?.id)) {
      throw new NotFoundException('Session not found');
    }
    await this.sessionService.deleteById(session.id);
  }

  @UseGuards(DynamicAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(
    @Request() request,
    @Query('includeCurrent') includeCurrent?: string,
  ): Promise<void> {
    const userId = request.user?.id;
    const sessionId = request.user?.sessionId;
    const shouldIncludeCurrent = includeCurrent === 'true';

    if (shouldIncludeCurrent || !sessionId) {
      await this.sessionService.deleteByUserId({ userId });
      return;
    }

    await this.sessionService.deleteByUserIdWithExclude({
      userId,
      excludeSessionId: sessionId,
    });
  }

  @ApiOkResponse({
    type: RefreshResponseDto,
  })
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() request): Promise<RefreshResponseDto> {
    return this.authService.refreshToken({
      sessionId: request.user.sessionId,
      hash: request.user.hash,
    });
  }
}
