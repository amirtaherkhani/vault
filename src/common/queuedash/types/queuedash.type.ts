export type QueueDashQueueType = 'bullmq';

export type QueueDashQueueRegistration = {
  queue: unknown;
  displayName: string;
  type: QueueDashQueueType;
};
