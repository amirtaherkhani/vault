import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { InternalEventEntity as InternalEventOutboxEntity } from '../../internal-events/infrastructure/persistence/relational/entities/internal-event.entity';
import { EmitInternalEventDto } from './dto/emit-internal-event.dto';
import { LoggerService } from '../logger/logger.service';
import { InternalEventMapper } from '../../internal-events/infrastructure/persistence/relational/mappers/internal-event.mapper';
import { InternalEvent } from '../../internal-events/domain/internal-event';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { INTERNAL_EVENTS_DEFAULT_ENABLE } from './types/internal-events-const.type';
import { BaseToggleableService } from '../base/base-toggleable.service';

@Injectable()
export class InternalEventsService extends BaseToggleableService {
  static readonly displayName = 'Event Manager';

  constructor(
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    super(
      InternalEventsService.name,
      configService.get(
        'internalEvents.enable',
        INTERNAL_EVENTS_DEFAULT_ENABLE,
        { infer: true },
      ),
      {
        id: 'internal-events',
        displayName: InternalEventsService.displayName,
        configKey: 'internalEvents.enable',
        envKey: 'INTERNAL_EVENTS_ENABLE',
        description: 'Internal events outbox publisher.',
        tags: ['Event'],
      },
    );
  }

  async emit(
    manager: EntityManager,
    event: EmitInternalEventDto,
  ): Promise<InternalEvent> {
    if (!this.isEnabled) {
      this.loggerService.warn(
        'Internal events are disabled; skipping emit.',
        InternalEventsService.name,
      );
      throw new Error('Internal events are disabled.');
    }
    const outbox = manager.create(InternalEventOutboxEntity, {
      eventType: event.eventType,
      payload: (event.payload ?? {}) as Record<string, unknown>,
    });
    const saved = await manager.save(InternalEventOutboxEntity, outbox);
    return InternalEventMapper.toDomain(saved);
  }
}
