import {
  INTERNAL_EVENTS_DEFAULT_CONSUMER_BLOCK_MS,
  INTERNAL_EVENTS_DEFAULT_CONSUMER_COUNT,
  INTERNAL_EVENTS_DEFAULT_DISPATCH_BATCH_SIZE,
  INTERNAL_EVENTS_DEFAULT_DISPATCH_INTERVAL_MS,
  INTERNAL_EVENTS_DEFAULT_DLQ_STREAM_NAME,
  INTERNAL_EVENTS_DEFAULT_ENABLE,
  INTERNAL_EVENTS_DEFAULT_IDEMPOTENCY_TTL_SECONDS,
  INTERNAL_EVENTS_DEFAULT_MAX_RETRIES,
  INTERNAL_EVENTS_DEFAULT_OUTBOX_RETENTION_DAYS,
  INTERNAL_EVENTS_DEFAULT_PENDING_CLAIM_AFTER_MS,
  INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_MAX_MS,
  INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_STEP_MS,
  INTERNAL_EVENTS_DEFAULT_REDIS_MAX_RETRIES_PER_REQUEST,
  INTERNAL_EVENTS_DEFAULT_REDIS_URL,
  INTERNAL_EVENTS_DEFAULT_SERVICE_NAME,
  INTERNAL_EVENTS_DEFAULT_STREAM_NAME,
  INTERNAL_EVENTS_DEFAULT_STREAM_TRIM_MAX_LEN,
} from '../types/internal-events-const.type';

export type InternalEventsOptions = {
  enable: boolean;
  serviceName: string;
  streamName: string;
  dlqStreamName?: string;
  redisUrl?: string;
  dispatchIntervalMs: number;
  dispatchBatchSize: number;
  outboxRetentionDays: number;
  consumerBlockMs: number;
  consumerCount: number;
  idempotencyTtlSeconds: number;
  maxRetries: number;
  pendingClaimAfterMs: number;
  streamTrimMaxLen?: number;
  redisRetryStepMs: number;
  redisRetryMaxMs: number;
  redisMaxRetriesPerRequest: number;
};

export type InternalEventsModuleOptions = InternalEventsOptions;
export type InternalEventsConfig = InternalEventsOptions;

export const INTERNAL_EVENTS_DEFAULT_OPTIONS: InternalEventsOptions = {
  enable: INTERNAL_EVENTS_DEFAULT_ENABLE,
  serviceName: INTERNAL_EVENTS_DEFAULT_SERVICE_NAME,
  streamName: INTERNAL_EVENTS_DEFAULT_STREAM_NAME,
  dlqStreamName: INTERNAL_EVENTS_DEFAULT_DLQ_STREAM_NAME,
  redisUrl: INTERNAL_EVENTS_DEFAULT_REDIS_URL,
  dispatchIntervalMs: INTERNAL_EVENTS_DEFAULT_DISPATCH_INTERVAL_MS,
  dispatchBatchSize: INTERNAL_EVENTS_DEFAULT_DISPATCH_BATCH_SIZE,
  outboxRetentionDays: INTERNAL_EVENTS_DEFAULT_OUTBOX_RETENTION_DAYS,
  consumerBlockMs: INTERNAL_EVENTS_DEFAULT_CONSUMER_BLOCK_MS,
  consumerCount: INTERNAL_EVENTS_DEFAULT_CONSUMER_COUNT,
  idempotencyTtlSeconds: INTERNAL_EVENTS_DEFAULT_IDEMPOTENCY_TTL_SECONDS,
  maxRetries: INTERNAL_EVENTS_DEFAULT_MAX_RETRIES,
  pendingClaimAfterMs: INTERNAL_EVENTS_DEFAULT_PENDING_CLAIM_AFTER_MS,
  streamTrimMaxLen: INTERNAL_EVENTS_DEFAULT_STREAM_TRIM_MAX_LEN,
  redisRetryStepMs: INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_STEP_MS,
  redisRetryMaxMs: INTERNAL_EVENTS_DEFAULT_REDIS_RETRY_MAX_MS,
  redisMaxRetriesPerRequest:
    INTERNAL_EVENTS_DEFAULT_REDIS_MAX_RETRIES_PER_REQUEST,
};

export function buildInternalEventsOptions(
  overrides: Partial<InternalEventsOptions> = {},
): InternalEventsOptions {
  return {
    ...INTERNAL_EVENTS_DEFAULT_OPTIONS,
    ...overrides,
  };
}
