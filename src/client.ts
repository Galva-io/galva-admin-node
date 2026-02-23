import {
  IdentifyPayload,
  IdentifyFromClientPayload,
  TrackFromClientPayload,
  SyncEventPayload,
  SyncEventForMultiplePayload,
  AliasFromClientPayload,
  BatchMessage,
  SyncBillingEventPayload,
} from "./types";

export interface GalvaOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export class Galva {
  private config: Required<GalvaOptions>;

  constructor(options: GalvaOptions) {
    this.config = {
      apiKey: options.apiKey,
      baseUrl: options.baseUrl ?? "https://api.galva.io",
      timeout: options.timeout ?? 30000,
    };
  }

  // ----------------------------------------
  // NAMESPACE: endUsers (Admin APIs)
  // ----------------------------------------
  public endUsers = {
    /**
     * Identify an end user with traits and entitlements.
     * POST /endUsers:identify
     */
    identify: async (payload: IdentifyPayload): Promise<void> => {
      return this.sendRequest("POST", "/endUsers:identify", payload);
    },

    /**
     * Sync events for a specific end user.
     * POST /endUsers/:endUserId/events
     * @param endUserId - The end user ID
     * @param events - Single event or array of events
     */
    syncEvents: async (
      endUserId: string,
      events: SyncEventPayload | SyncEventPayload[]
    ): Promise<void> => {
      return this.sendRequest(
        "POST",
        `/endUsers/${encodeURIComponent(endUserId)}/events`,
        events
      );
    },

    /**
     * Sync events for multiple end users.
     * POST /endUsers/events
     * @param events - Single event or array of events with endUserId
     */
    syncEventsForMultiple: async (
      events: SyncEventForMultiplePayload | SyncEventForMultiplePayload[]
    ): Promise<void> => {
      return this.sendRequest("POST", "/endUsers/events", events);
    },

    /**
     * Sync billing events (standard or raw platform webhooks).
     * POST /endUsers/billingEvents
     */
    syncBillingEvents: async (
      payload: SyncBillingEventPayload
    ): Promise<void> => {
      return this.sendRequest("POST", "/endUsers/billingEvents", payload);
    },
  };

  // ----------------------------------------
  // NAMESPACE: client (Client APIs)
  // These are typically used from client-side SDKs
  // ----------------------------------------
  public client = {
    /**
     * Identify an end user from client.
     * POST /endUsers:identify:client
     */
    identify: async (payload: IdentifyFromClientPayload): Promise<void> => {
      return this.sendRequest("POST", "/endUsers:identify:client", payload);
    },

    /**
     * Track an event from client.
     * POST /endUsers:track:client
     */
    track: async (payload: TrackFromClientPayload): Promise<void> => {
      return this.sendRequest("POST", "/endUsers:track:client", payload);
    },

    /**
     * Alias (merge) an anonymous user to a known end user.
     * POST /endUsers:alias:client
     */
    alias: async (payload: AliasFromClientPayload): Promise<void> => {
      return this.sendRequest("POST", "/endUsers:alias:client", payload);
    },

    /**
     * Batch collect multiple messages (identify, track, alias).
     * POST /endUsers:batch:client
     */
    batch: async (messages: BatchMessage[]): Promise<void> => {
      return this.sendRequest("POST", "/endUsers:batch:client", messages);
    },
  };

  // ----------------------------------------
  // INTERNAL HELPER
  // ----------------------------------------
  private async sendRequest(
    method: "POST" | "GET",
    endpoint: string,
    data?: unknown
  ): Promise<void> {
    const url = `${this.config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Galva API error: ${response.status} ${response.statusText} - ${errorBody}`
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
