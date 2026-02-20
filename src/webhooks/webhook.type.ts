export interface TestWebhookInput {
  event?: string;
  payload?: Record<string, any>;
}

export interface WebhookParseContext {
  path?: string;
}

export interface WebhookHandler {
  parse: (
    body: any,
    headers: Record<string, any>,
    context?: WebhookParseContext,
  ) => Promise<{
    type: string;
    data: Record<string, any>;
  }>;
}

export interface ParsedWebhookEvent {
  type: string;
  data: Record<string, any>;
}
