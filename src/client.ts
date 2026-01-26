import {
  GalvaConfig,
  GalvaError,
  UserIdentifyData,
  ApiResponse,
  BillingEvent,
  BatchEventOptions,
} from './types';

export class GalvaAdmin {
  private config: Required<GalvaConfig>;
  private eventQueue: BillingEvent[] = [];
  private flushTimer?: ReturnType<typeof setTimeout>;

  constructor(config: GalvaConfig) {
    if (!config.apiKey) {
      throw new GalvaError('API key is required', 'MISSING_API_KEY');
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.galva.io',
      timeout: config.timeout || 30000,
      debug: config.debug || false,
    };
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[Galva] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }

  private async request<T = any>(
    endpoint: string,
    method: string = 'POST',
    body?: any
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      this.log(`${method} ${endpoint}`, body);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-SDK-Version': '1.0.0',
          'X-SDK-Platform': 'nodejs',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        throw new GalvaError(
          data?.message || `HTTP ${response.status}`,
          data?.code || 'API_ERROR',
          response.status,
          data
        );
      }

      this.log(`Response from ${endpoint}`, data);
      return { success: true, data };
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new GalvaError(
          `Request timed out after ${this.config.timeout}ms`,
          'TIMEOUT_ERROR'
        );
      }

      if (error instanceof GalvaError) {
        throw error;
      }

      throw new GalvaError(
        error.message || 'Network error occurred',
        'NETWORK_ERROR'
      );
    }
  }

  /**
   * Identify a user with their attributes
   */
  async identify(data: UserIdentifyData): Promise<ApiResponse> {
    return this.request('/users/identify', 'POST', data);
  }

  /**
   * Sync a single billing event
   */
  async syncEvent(event: BillingEvent): Promise<ApiResponse> {
    return this.request('/events/billing', 'POST', event);
  }

  /**
   * Batch sync multiple billing events
   */
  async syncEvents(events: BillingEvent[]): Promise<ApiResponse> {
    return this.request('/events/billing/batch', 'POST', { events });
  }

  /**
   * Queue an event for batch processing
   */
  queueEvent(event: BillingEvent, options?: BatchEventOptions): void {
    this.eventQueue.push(event);
    
    const maxBatchSize = options?.maxBatchSize || 100;
    const flushInterval = options?.flushInterval || 5000;

    if (this.eventQueue.length >= maxBatchSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), flushInterval);
    }
  }

  /**
   * Manually flush the event queue
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.syncEvents(events);
      this.log(`Flushed ${events.length} events`);
    } catch (error) {
      this.log(`Failed to flush events`, error);
      this.eventQueue.unshift(...events);
      throw error;
    }
  }

  /**
   * Track a purchase event
   */
  async trackPurchase(event: Omit<BillingEvent, 'type'> & { 
    purchasedAt: string;
    expiresAt?: string;
    isTrial?: boolean;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'initial-purchase',
    } as BillingEvent);
  }

  /**
   * Track a renewal event
   */
  async trackRenewal(event: Omit<BillingEvent, 'type'> & {
    purchasedAt: string;
    expiresAt?: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'renewal',
    } as BillingEvent);
  }

  /**
   * Track a cancellation event
   */
  async trackCancellation(event: Omit<BillingEvent, 'type'> & {
    cancelReason: string;
    expiresAt?: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'cancellation',
    } as BillingEvent);
  }

  /**
   * Track a billing issue event
   */
  async trackBillingIssue(event: Omit<BillingEvent, 'type'> & {
    expiresAt?: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'billing-issue',
    } as BillingEvent);
  }

  /**
   * Track an expiration event
   */
  async trackExpiration(event: Omit<BillingEvent, 'type'> & {
    expirationReason: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'expiration',
    } as BillingEvent);
  }

  /**
   * Track an upgrade event
   */
  async trackUpgrade(event: Omit<BillingEvent, 'type'> & {
    fromPlanId: string;
    toPlanId: string;
    expiresAt?: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'upgraded',
    } as BillingEvent);
  }

  /**
   * Track a refund event
   */
  async trackRefund(event: Omit<BillingEvent, 'type'> & {
    reason: string;
  }): Promise<ApiResponse> {
    return this.syncEvent({
      ...event,
      type: 'refund',
    } as BillingEvent);
  }

  /**
   * Get user subscription status
   */
  async getUserStatus(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}/status`, 'GET');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health', 'GET');
  }
}