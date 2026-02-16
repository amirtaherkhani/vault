import {
  Controller,
  Post,
  Param,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { WebhookResponseDto } from './dto/webhook-response.dto';
import { TypeMessage } from '../utils/types/message.type';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming webhook events' })
  @ApiParam({
    name: 'provider',
    description: 'The provider name for this webhook (e.g., test, striga)',
    example: 'striga',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        type: 'SEPA_PAYIN_COMPLETED',
        id: 'ad8b61cf-ea28-4f2f-a0ee-170b47d3d136',
      },
    },
    description: 'The incoming webhook payload',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: TypeMessage.getMessageByStatus(HttpStatus.OK),
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: TypeMessage.getMessageByStatus(HttpStatus.BAD_REQUEST),
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: TypeMessage.getMessageByStatus(
      HttpStatus.INTERNAL_SERVER_ERROR,
    ),
  })
  async handleProviderWebhook(
    @Param('provider') provider: string,
    @Body() body: Record<string, any>,
    @Headers() headers: Record<string, string>,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.process(provider, body, headers);
  }

  @Post([
    ':provider/:webhookPath',
    ':provider/:webhookPath/:webhookSubPath',
    ':provider/:webhookPath/:webhookSubPath/:webhookTail',
  ])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle incoming webhook events by provider path' })
  @ApiParam({
    name: 'provider',
    description: 'The provider name for this webhook (e.g., striga)',
    example: 'striga',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: true,
      example: {
        type: 'SEPA_PAYIN_COMPLETED',
        id: 'ad8b61cf-ea28-4f2f-a0ee-170b47d3d136',
      },
    },
    description: 'The incoming webhook payload',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: TypeMessage.getMessageByStatus(HttpStatus.OK),
    type: WebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: TypeMessage.getMessageByStatus(HttpStatus.BAD_REQUEST),
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: TypeMessage.getMessageByStatus(
      HttpStatus.INTERNAL_SERVER_ERROR,
    ),
  })
  async handleProviderWebhookWithPath(
    @Param('provider') provider: string,
    @Param('webhookPath') webhookPath: string,
    @Param('webhookSubPath') webhookSubPath: string | undefined,
    @Param('webhookTail') webhookTail: string | undefined,
    @Body() body: Record<string, any>,
    @Headers() headers: Record<string, string>,
  ): Promise<WebhookResponseDto> {
    const path = [webhookPath, webhookSubPath, webhookTail]
      .filter((segment): segment is string => !!segment)
      .join('/');

    return this.webhooksService.process(provider, body, headers, `/${path}`);
  }
}
