import { UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  ParsedWebhookEvent,
  StrigaWebhookInput,
  WebhookParseContext,
} from '../webhook.type';
import { Logger } from '@nestjs/common';

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
    if (typeof payload.type === 'string' && payload.type.length > 0) {
      return `KYC_${payload.type}`;
    }
    if (typeof payload.status === 'string' && payload.status.length > 0) {
      return `KYC_${payload.status}`;
    }
    if (typeof payload.reason === 'string' && payload.reason.length > 0) {
      return `KYC_${payload.reason}`;
    }
    return 'KYC_UPDATE';
  }

  if (path.startsWith('/kyb')) {
    // KYB webhooks are primarily status-driven, with optional reason/type.
    if (typeof payload.type === 'string' && payload.type.length > 0) {
      return `KYB_${payload.type}`;
    }
    if (typeof payload.status === 'string' && payload.status.length > 0) {
      return `KYB_${payload.status}`;
    }
    if (typeof payload.reason === 'string' && payload.reason.length > 0) {
      return `KYB_${payload.reason}`;
    }
    return 'KYB_UPDATE';
  }

  if (path.startsWith('/card/watch')) {
    if (typeof payload.status === 'string' && payload.status.length > 0) {
      return `CARD_${payload.status}`;
    }
    if (typeof payload.type === 'string' && payload.type.length > 0) {
      return `CARD_${payload.type}`;
    }
    return 'CARD_UPDATE';
  }

  if (path.startsWith('/tx')) {
    if (typeof payload.type === 'string' && payload.type.length > 0) {
      return payload.type;
    }
    return 'TX_UPDATE';
  }

  return path.slice(1).replace(/\//g, '_');
}

function inferEventType(path: string, payload: StrigaWebhookInput): string {
  const pathType = inferTypeFromPath(path, payload);
  if (pathType) return pathType;

  if (typeof payload.event === 'string' && payload.event.length > 0) {
    return payload.event;
  }

  if (typeof payload.type === 'string' && payload.type.length > 0) {
    return payload.type;
  }

  if (typeof payload.status === 'string' && payload.status.length > 0) {
    return payload.status;
  }

  return 'EVENT';
}

export const StrigaWebhookHandler = {
  parse(
    body: StrigaWebhookInput,
    headers: Record<string, any>,
    context?: WebhookParseContext,
  ): Promise<ParsedWebhookEvent> {
    const path = normalizeWebhookPath(context?.path);
    const hasSignature =
      getHeaderValue(headers, STRIGA_SIGNATURE_HEADER) !== null;
    logger.debug(
      ` Received Striga webhook${path ? ` path=${path}` : ''} signature=${hasSignature ? 'present' : 'missing'}`,
    );

    verifySignature(body, headers);

    const payload = asRecord(body) as StrigaWebhookInput;
    const type = normalizeEventType(inferEventType(path, payload));
    logger.debug(
      `Parsed Striga webhook${path ? ` path=${path}` : ''} type=${type}`,
    );

    return Promise.resolve({
      type,
      data: path ? { ...payload, webhookPath: path } : payload,
    });
  },
};
