import { Inject, Injectable } from '@nestjs/common';
import os from 'os';
import { InternalEventsRedisService } from './internal-events.redis.service';
import { InternalEventsRegistry } from './internal-events.registry';
import { INTERNAL_EVENTS_OPTIONS } from './types/internal-events-constants.type';
import { InternalEvent } from '../../internal-events/domain/internal-event';
import { InternalEventsOptions } from './config/internal-events-config.type';
import { LoggerService } from '../logger/logger.service';
import { InternalEventMessageDto } from './dto/internal-event-message.dto';

@Injectable()
export class InternalEventsConsumer {
  private running = false;
  private consumerName = '';
  private lastClaimAt = 0;

  constructor(
    private readonly redisService: InternalEventsRedisService,
    private readonly registry: InternalEventsRegistry,
    private readonly loggerService: LoggerService,
    @Inject(INTERNAL_EVENTS_OPTIONS)
    private readonly options: InternalEventsOptions,
  ) {}

  async onModuleInit() {
    if (!this.options.enable) {
      this.loggerService.warn(
        'Internal events are disabled; consumer not started.',
        InternalEventsConsumer.name,
      );
      return;
    }

    // const redis = this.redisService.getClient();
    const suffix = `${os.hostname()}-${process.pid}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    this.consumerName = `${this.options.serviceName}-${suffix}`;

    await this.ensureStreamGroup();

    this.running = true;
    this.loggerService.log(
      `Internal events consumer started name=${this.consumerName}`,
      InternalEventsConsumer.name,
    );
    void this.consumeLoop();
  }

  onModuleDestroy() {
    this.running = false;
    this.loggerService.debug(
      'Internal events consumer stopped',
      InternalEventsConsumer.name,
    );
  }

  private async ensureStreamGroup() {
    const redis = this.redisService.getClient();

    try {
      await (redis as any).xgroup(
        'CREATE',
        this.options.streamName,
        this.options.serviceName,
        '$',
        'MKSTREAM',
      );
      this.loggerService.log(
        `Internal events consumer group created stream=${this.options.streamName} group=${this.options.serviceName}`,
        InternalEventsConsumer.name,
      );
    } catch (error) {
      const message = (error as Error)?.message ?? String(error);
      if (!message.includes('BUSYGROUP')) {
        throw error;
      }
    }
  }

  private async consumeLoop() {
    const redis = this.redisService.getClient();

    while (this.running) {
      try {
        await this.maybeClaimPending();

        const response = await (redis as any).xreadgroup(
          'GROUP',
          this.options.serviceName,
          this.consumerName,
          'BLOCK',
          this.options.consumerBlockMs,
          'COUNT',
          this.options.consumerCount,
          'STREAMS',
          this.options.streamName,
          '>',
        );

        if (!response) continue;

        for (const [, entries] of response as [
          string,
          [string, string[]][],
        ][]) {
          for (const [id, fields] of entries) {
            await this.processMessage(id, this.parseFields(fields));
          }
        }
      } catch (error) {
        const reason = (error as Error)?.message ?? String(error);
        if (this.isNoGroupError(reason)) {
          this.loggerService.warn(
            `Internal events stream/group missing; recreating stream=${this.options.streamName} group=${this.options.serviceName}`,
            InternalEventsConsumer.name,
          );
          try {
            await this.ensureStreamGroup();
          } catch (ensureError) {
            const ensureReason =
              (ensureError as Error)?.message ?? String(ensureError);
            this.loggerService.warn(
              `InternalEventsConsumer ensureStreamGroup failed: ${ensureReason}`,
              InternalEventsConsumer.name,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
          continue;
        }

        this.loggerService.warn(
          `InternalEventsConsumer loop failed: ${reason}`,
          InternalEventsConsumer.name,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async maybeClaimPending() {
    const now = Date.now();
    if (now - this.lastClaimAt < this.options.pendingClaimAfterMs) return;
    this.lastClaimAt = now;

    const redis = this.redisService.getClient();

    try {
      const response = await (redis as any).xautoclaim(
        this.options.streamName,
        this.options.serviceName,
        this.consumerName,
        this.options.pendingClaimAfterMs,
        '0-0',
        'COUNT',
        this.options.consumerCount,
      );

      if (!response) return;

      const [, entries] = response as [string, [string, string[]][]];

      for (const [id, fields] of entries) {
        await this.processMessage(id, this.parseFields(fields));
      }
    } catch (error) {
      const reason = (error as Error)?.message ?? String(error);
      this.loggerService.warn(
        `InternalEventsConsumer pending claim failed: ${reason}`,
        InternalEventsConsumer.name,
      );
    }
  }

  private isNoGroupError(message: string): boolean {
    return message.includes('NOGROUP');
  }

  private parseFields(fields: string[]): Record<string, string> {
    const data: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }
    return data;
  }

  private async processMessage(id: string, fields: Record<string, string>) {
    const redis = this.redisService.getClient();

    const message: InternalEventMessageDto = {
      eventId: fields.eventId,
      eventType: fields.eventType,
      payload: fields.payload ? JSON.parse(fields.payload) : {},
      occurredAt: fields.occurredAt,
    };

    const occurredAtDate = message.occurredAt
      ? new Date(message.occurredAt)
      : new Date();

    const domainEvent: InternalEvent = {
      eventId: message.eventId,
      eventType: message.eventType,
      payload: message.payload ?? {},
      occurredAt: occurredAtDate,
      id: message.eventId,
      createdAt: occurredAtDate,
      updatedAt: occurredAtDate,
      publishedAt: null,
    };

    const idempotencyKey = `processed:${this.options.serviceName}:${message.eventId}`;

    const setResult = await redis.set(
      idempotencyKey,
      '1',
      'EX',
      this.options.idempotencyTtlSeconds,
      'NX',
    );

    if (!setResult) {
      await (redis as any).xack(
        this.options.streamName,
        this.options.serviceName,
        id,
      );
      return;
    }

    try {
      const handlers = this.registry.getHandlers(message.eventType);
      if (!handlers.length) {
        this.loggerService.warn(
          `No handler for internal event: ${message.eventType}`,
          InternalEventsConsumer.name,
        );
      }

      for (const handler of handlers) {
        await handler.handle(domainEvent);
      }

      await (redis as any).xack(
        this.options.streamName,
        this.options.serviceName,
        id,
      );
    } catch (error) {
      await redis.del(idempotencyKey);
      await this.handleFailure(id, domainEvent, error as Error);
    }
  }

  private async handleFailure(
    id: string,
    message: InternalEvent,
    error: Error,
  ) {
    const redis = this.redisService.getClient();
    const retryKey = `internal-events:retries:${this.options.serviceName}:${id}`;
    const retries = await redis.incr(retryKey);
    await redis.expire(retryKey, this.options.idempotencyTtlSeconds);

    if (retries < this.options.maxRetries) {
      this.loggerService.warn(
        `Internal event ${message.eventType} failed (attempt ${retries}): ${error.message}`,
        InternalEventsConsumer.name,
      );
      return;
    }

    if (this.options.dlqStreamName) {
      await (redis as any).xadd(
        this.options.dlqStreamName,
        '*',
        'eventId',
        message.eventId,
        'eventType',
        message.eventType,
        'payload',
        JSON.stringify(message.payload ?? {}),
        'occurredAt',
        (message.occurredAt ?? new Date()).toISOString(),
        'error',
        error.message,
      );
    }

    await (redis as any).xack(
      this.options.streamName,
      this.options.serviceName,
      id,
    );
    await redis.del(retryKey);
  }
}
