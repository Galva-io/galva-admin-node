export interface IdentifyPayload {
  endUserId: string;
  timestamp?: Date | string;
  context?: Record<string, unknown>;
  traits?: Record<string, unknown>;
  entitlements?: unknown[];
}

export interface IdentifyFromClientPayload {
  messageId?: string;
  anonymousId?: string;
  endUserId?: string;
  sentAt: Date | string;
  timestamp: Date | string;
  context?: Record<string, unknown>;
  traits?: Record<string, unknown>;
}
