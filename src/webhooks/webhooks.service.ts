import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InternalEventsService } from '../common/internal-events/internal-events.service';
import {
  STRIGA_WEBHOOK_USER_CREATED_EVENT,
  STRIGA_WEBHOOK_USER_CREATED_TYPES,
} from '../providers/striga/types/striga-event.type';
import { WebhookEventEmitter } from './events/webhook.event-emitter';
import { WebhookHandlers } from './handlers';
import { WebhookResponseDto } from './dto/webhook-response.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly emitter: WebhookEventEmitter,
    private readonly internalEventsService: InternalEventsService,
    private readonly dataSource: DataSource,
  ) {}

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
    await this.emitProviderInternalEvent(provider, type, data);

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

  private async emitProviderInternalEvent(
    provider: string,
    type: string,
    data: Record<string, any>,
  ): Promise<void> {
    if (provider !== 'striga') {
      return;
    }

    const internalEventType = this.resolveStrigaInternalEventType(type, data);
    if (!internalEventType) {
      return;
    }

    try {
      await this.internalEventsService.emit(this.dataSource.manager, {
        eventType: internalEventType,
        payload: {
          provider,
          type,
          ...data,
        },
      });
      this.logger.debug(
        `Queued internal event from webhook: ${internalEventType}`,
      );
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      if (message.includes('Internal events are disabled')) {
        this.logger.warn(
          `Internal events are disabled; skipping webhook->internal event emit (${internalEventType}).`,
        );
        return;
      }
      this.logger.error(
        `Failed to queue internal event ${internalEventType}: ${message}`,
      );
      throw error;
    }
  }

  private resolveStrigaInternalEventType(
    type: string,
    data: Record<string, any>,
  ): string | null {
    const normalizedType = String(type ?? '')
      .trim()
      .toUpperCase();
    const payloadType = String(data?.type ?? '')
      .trim()
      .toUpperCase();
    const payloadEvent = String(data?.event ?? '')
      .trim()
      .toUpperCase();

    const isUserCreatedType = [normalizedType, payloadType, payloadEvent].some(
      (value) =>
        (STRIGA_WEBHOOK_USER_CREATED_TYPES as readonly string[]).includes(
          value,
        ),
    );

    if (isUserCreatedType) {
      return STRIGA_WEBHOOK_USER_CREATED_EVENT;
    }

    return null;
  }
}
