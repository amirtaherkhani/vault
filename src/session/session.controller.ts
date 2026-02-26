import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { SessionDto } from './dto/session.dto';
import { DynamicAuthGuard } from '../auth/guards/dynamic-auth.guard';
import { SessionRequest } from './types/session-base.type';

@ApiTags('Sessions')
@ApiBearerAuth()
@Controller({
  path: 'sessions',
  version: '1',
})
export class SessionsController {
  constructor(private readonly sessionService: SessionService) {}

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
  async deleteAll(@Request() request: SessionRequest): Promise<void> {
    await this.sessionService.deleteAllForUser(request.user);
  }
}
