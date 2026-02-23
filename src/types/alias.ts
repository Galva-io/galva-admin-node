export interface AliasFromClientPayload {
  messageId?: string;
  targetId?: string;
  previousId?: string;
  sentAt: Date | string;
  timestamp: Date | string;
  context?: Record<string, unknown>;
}
