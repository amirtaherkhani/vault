import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { QueueDashQueueRegistration } from './types/queuedash.type';

@Injectable()
export class QueueDashRegistry {
  private readonly context = QueueDashRegistry.name;
  private readonly queues: QueueDashQueueRegistration[] = [];

  constructor(private readonly logger: LoggerService) {}

  registerQueue(registration: QueueDashQueueRegistration): void {
    const existingIndex = this.queues.findIndex(
      (q) =>
        q.displayName === registration.displayName &&
        q.type === registration.type,
    );

    if (existingIndex !== -1) {
      this.queues[existingIndex] = registration;
      this.logger.log(
        `Queue updated: ${registration.displayName} (${registration.type})`,
        this.context,
      );
      this.logger.debug(
        `Queue registry size: ${this.queues.length}`,
        this.context,
      );
      return;
    }

    this.queues.push(registration);
    this.logger.log(
      `Queue registered: ${registration.displayName} (${registration.type})`,
      this.context,
    );
    this.logger.debug(
      `Queue registry size: ${this.queues.length}`,
      this.context,
    );
  }

  registerBullMqQueue(queue: unknown, displayName: string): void {
    this.registerQueue({
      queue,
      displayName,
      type: 'bullmq',
    });
  }

  getQueues(): QueueDashQueueRegistration[] {
    return [...this.queues];
  }
}
