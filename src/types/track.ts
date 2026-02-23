import { EndUserSourceType } from "./enums";

export interface TrackFromClientPayload {
  messageId?: string;
  anonymousId?: string;
  endUserId?: string;
  sentAt: Date | string;
  timestamp: Date | string;
  context?: Record<string, unknown>;
  sourceType?: EndUserSourceType;
  sourceId?: string;
  event: string;
  properties?: Record<string, unknown>;
}

export interface SyncEventPayload {
  timestamp: Date | string;
  context?: Record<string, unknown>;
  sourceType?: EndUserSourceType;
  sourceId?: string;
  event: string;
  properties?: Record<string, unknown>;
}

export interface SyncEventForMultiplePayload {
  endUserId: string;
  timestamp: Date | string;
  sourceType?: EndUserSourceType;
  sourceId?: string;
  name: string;
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
}
