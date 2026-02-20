export interface StrigaWebhookInput extends Record<string, any> {
  userId?: string;
  event?: string;
  type?: string;
  status?: string;
  reason?: string;
  webhookPath?: string;
}

export interface StrigaWebhookParseContext {
  path?: string;
}

export interface StrigaParsedWebhookEvent {
  type: string;
  data: Record<string, any>;
}
