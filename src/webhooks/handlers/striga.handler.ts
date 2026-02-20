import { UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { plainToInstance } from 'class-transformer';
import { Logger } from '@nestjs/common';
import { StrigaKycWebhookDto } from '../../providers/striga/dto/striga-kyc-webhook.dto';
import {
  StrigaParsedWebhookEvent,
  StrigaWebhookInput,
  StrigaWebhookParseContext,
} from '../../providers/striga/types/striga-webhook.type';
import {
  getNonEmptyString,
  pickFirstNonEmptyString,
} from '../helpers/webhook-payload.helper';

const STRIGA_SIGNATURE_HEADER = 'signature';
const STRIGA_API_KEY_ENV = 'STRIGA_API_KEY';
const logger = new Logger('StrigaWebhookHandler');

function normalizeWebhookPath(path?: string): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  return `/${trimmed.replace(/^\/+/, '')}`;
}

function normalizeEventType(type: string): string {
  return type
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_.-]/g, '_')
    .toUpperCase();
}

function getHeaderValue(
  headers: Record<string, any>,
  key: string,
): string | null {
  const value = headers[key] ?? headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }
  return typeof value === 'string' ? value : null;
}

function normalizeSignature(signature: string): string {
  const value = signature.trim().toLowerCase();
  return value.startsWith('sha256=') ? value.slice(7) : value;
}

function calculateExpectedSignature(apiKey: string, body: unknown): string {
  const signature = createHmac('sha256', apiKey);
  signature.update(JSON.stringify(body ?? {}));
  return signature.digest('hex');
}

function verifySignature(body: unknown, headers: Record<string, any>): void {
  const apiKey = process.env[STRIGA_API_KEY_ENV]?.trim();
  if (!apiKey) {
    throw new UnauthorizedException(
      'Striga webhook verification is misconfigured.',
    );
  }

  const headerSignature = getHeaderValue(headers, STRIGA_SIGNATURE_HEADER);
  if (!headerSignature) {
    throw new UnauthorizedException('Missing Striga webhook signature header.');
  }

  const providedSignature = normalizeSignature(headerSignature);
  const expectedSignature = calculateExpectedSignature(apiKey, body);

  if (providedSignature.length !== expectedSignature.length) {
    throw new UnauthorizedException('Invalid Striga webhook signature.');
  }

  const isValid = timingSafeEqual(
    Buffer.from(providedSignature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8'),
  );

  if (!isValid) {
    throw new UnauthorizedException('Invalid Striga webhook signature.');
  }
}

function asRecord(body: unknown): Record<string, any> {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, any>;
  }
  return { value: body };
}

function inferTypeFromPath(
  path: string,
  payload: StrigaWebhookInput,
): string | null {
  if (!path) return null;

  if (path.startsWith('/ping')) return 'PING';

  if (path.startsWith('/kyc')) {
    // KYC webhooks can include status updates and account action events.
    const indicator = pickFirstNonEmptyString(
      payload.type,
      payload.status,
      payload.reason,
    );
    if (indicator) return `KYC_${indicator}`;
    return 'KYC_UPDATE';
  }

  if (path.startsWith('/kyb')) {
    // KYB webhooks are primarily status-driven, with optional reason/type.
    const indicator = pickFirstNonEmptyString(
      payload.type,
      payload.status,
      payload.reason,
    );
    if (indicator) return `KYB_${indicator}`;
    return 'KYB_UPDATE';
  }

  if (path.startsWith('/card/watch')) {
    const indicator = pickFirstNonEmptyString(payload.status, payload.type);
    if (indicator) return `CARD_${indicator}`;
    return 'CARD_UPDATE';
  }

  if (path.startsWith('/tx')) {
    const type = getNonEmptyString(payload.type);
    if (type) return type;
    return 'TX_UPDATE';
  }

  if (path.startsWith('/user')) {
    const eventOrType = pickFirstNonEmptyString(payload.event, payload.type);
    if (eventOrType) return eventOrType;

    const status = getNonEmptyString(payload.status);
    if (status) return `USER_${status}`;
    return 'USER_UPDATE';
  }

  return path.slice(1).replace(/\//g, '_');
}

function inferEventType(path: string, payload: StrigaWebhookInput): string {
  const pathType = inferTypeFromPath(path, payload);
  if (pathType) return pathType;

  const indicator = pickFirstNonEmptyString(
    payload.event,
    payload.type,
    payload.status,
  );
  if (indicator) return indicator;

  return 'EVENT';
}

function parseWebhookPayloadByPath(
  path: string,
  payload: StrigaWebhookInput,
): Record<string, any> {
  if (path.startsWith('/kyc')) {
    return plainToInstance(StrigaKycWebhookDto, payload, {
      excludeExtraneousValues: true,
    }) as Record<string, any>;
  }

  return payload;
}

export const StrigaWebhookHandler = {
  parse(
    body: StrigaWebhookInput,
    headers: Record<string, any>,
    context?: StrigaWebhookParseContext,
  ): Promise<StrigaParsedWebhookEvent> {
    const path = normalizeWebhookPath(context?.path);
    const hasSignature =
      getHeaderValue(headers, STRIGA_SIGNATURE_HEADER) !== null;
    logger.debug(
      ` Received Striga webhook${path ? ` path=${path}` : ''} signature=${hasSignature ? 'present' : 'missing'}`,
    );

    verifySignature(body, headers);

    const payload = asRecord(body) as StrigaWebhookInput;
    const normalizedPayload = parseWebhookPayloadByPath(path, payload);
    const type = normalizeEventType(inferEventType(path, payload));
    logger.debug(
      `Parsed Striga webhook${path ? ` path=${path}` : ''} type=${type}`,
    );
    if (path.startsWith('/kyc')) {
      logger.debug(
        `Striga KYC webhook details userId=${String(normalizedPayload.userId ?? 'n/a')} status=${String(normalizedPayload.status ?? 'n/a')} reason=${String(normalizedPayload.reason ?? 'n/a')} currentTier=${String(normalizedPayload.currentTier ?? 'n/a')}`,
      );
    }

    return Promise.resolve({
      type,
      data: path
        ? { ...normalizedPayload, webhookPath: path }
        : normalizedPayload,
    });
  },
};
