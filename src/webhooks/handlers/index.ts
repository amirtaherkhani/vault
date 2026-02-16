import { StrigaWebhookHandler } from './striga.handler';
import { TestWebhookHandler } from './test.handler';
import { WebhookHandler } from '../webhook.type';

// Registry of all active webhook handlers by provider name
export const WebhookHandlers: Record<string, WebhookHandler> = {
  striga: StrigaWebhookHandler,
  test: TestWebhookHandler,
};
