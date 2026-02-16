import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WebhookEventEmitter } from './events/webhook.event-emitter';
import { WebhookHandlers } from './handlers';
import { WebhookResponseDto } from './dto/webhook-response.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly emitter: WebhookEventEmitter) {}

  async process(
    provider: string,
    body: Record<string, any>,
    headers: Record<string, any>,
    path?: string,
  ): Promise<WebhookResponseDto> {
    this.logger.debug(
      `Received webhook from provider: ${provider}${path ? `, path: ${path}` : ''}`,
    );

    const handler = WebhookHandlers[provider];
    if (!handler) {
      this.logger.warn(`No webhook handler found for provider "${provider}"`);
      throw new NotFoundException(
        `No handler found for provider "${provider}"`,
      );
    }

    const { type, data } = await handler.parse(body, headers, { path });

    const eventKey = `${provider}.${type}`;
    const listenerCount = this.emitter.listenerCount(eventKey);

    if (listenerCount === 0) {
      this.logger.warn(
        `No listeners registered for event: ${eventKey}. The event was received but will not trigger any action.`,
      );
    } else {
      this.logger.debug(`Emitting internal event: ${eventKey}`);
      this.emitter.emit(eventKey, data);
    }

    return { status: 'received' };
  }
}
