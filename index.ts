// ==========================================
// 1. DATA MODELS
// ==========================================

export type EntitlementStatus =
  | "active"
  | "expired"
  | "grace_period"
  | "paused"
  | "billing_retry";

/**
 * Represents a snapshot of a single subscription product.
 */
export interface Entitlement {
  planId: string;
  status: EntitlementStatus;
  expiresAt: Date | number; // Allow timestamp for better DX
  autoRenew: boolean;
  source?: "ios" | "android" | "stripe" | "manual";
}

/**
 * Static attributes about the user (CRM data).
 */
export interface UserTraits {
  email?: string;
  fullName?: string;
  ltv?: number;
  // Allow strict primitives for custom attributes
  attributes?: Record<string, string | number | boolean | null>;
}

// ==========================================
// 2. EVENT PAYLOADS
// ==========================================

/**
 * The base shape for ANY lifecycle event.
 */
interface BaseEventPayload {
  userId: string;
  planId: string; // Moved here because EVERY lifecycle event needs a plan context
  occurredAt?: Date | number; // Optional: Defaults to now

  // Optional: Update full state snapshot if developer wants to force-sync
  currentEntitlements?: Entitlement[];
}

// --- Specific Event Types ---

export interface SubscribedPayload extends BaseEventPayload {
  expirationDate: Date | number;
  isTrial?: boolean; // Critical for "Trial Conversion" workflows
  amountPaid?: number; // Used to calculate LTV automatically
}

export interface RenewedPayload extends BaseEventPayload {
  expirationDate: Date | number;
  amountPaid?: number; // Used to increment LTV
}

export interface CancelledPayload extends BaseEventPayload {
  /**
   * CRITICAL:
   * true = User turned off auto-renew but still has access (Trigger "Save" workflow).
   * false = User cancelled immediately and lost access (Trigger "Win-Back").
   */
  isStillActive: boolean;
  reason?: string; // Optional context (e.g. "too_expensive")
}

export interface ReactivatedPayload extends BaseEventPayload {
  expirationDate?: Date | number; // Optional: If reactivation extended the date
}

export interface PaymentFailedPayload extends BaseEventPayload {
  reason?: string; // e.g. "insufficient_funds", "card_expired"
  gracePeriodExpiresAt?: Date | number; // If known, helps with urgency
}

export interface ExpiredPayload extends BaseEventPayload {
  reason?: string; // e.g. "billing_error" vs "voluntary"
}

// ==========================================
// 3. SDK CONFIGURATION
// ==========================================

export interface GalvaOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

// ==========================================
// 4. THE SDK CLASS
// ==========================================

export class Galva {
  private config: GalvaOptions;

  constructor(options: GalvaOptions) {
    this.config = options;
  }

  // ----------------------------------------
  // NAMESPACE: USERS (Sync State)
  // ----------------------------------------
  public users = {
    /**
     * Identify a user and sync attributes (Email, Name, LTV).
     * Does NOT trigger automation workflows.
     */
    identify: async (userId: string, traits: UserTraits): Promise<void> => {
      return this.sendRequest("/users/identify", { userId, ...traits });
    },

    /**
     * Bulk import for historical backfill.
     * Use this for initial migration.
     */
    import: async (
      users: Array<{ userId: string } & UserTraits>
    ): Promise<void> => {
      return this.sendRequest("/users/batch", { users });
    },
  };

  // ----------------------------------------
  // NAMESPACE: LIFECYCLE (Trigger Workflows)
  // ----------------------------------------
  public lifecycle = {
    /**
     * Call when a NEW subscription or trial starts.
     */
    subscribed: async (payload: SubscribedPayload): Promise<void> => {
      return this.sendRequest("/events/subscribed", payload);
    },

    /**
     * Call when a recurring payment succeeds.
     * Stops "Win-back" or "Payment Recovery" workflows.
     */
    renewed: async (payload: RenewedPayload): Promise<void> => {
      return this.sendRequest("/events/renewed", payload);
    },

    /**
     * Call when user turns OFF auto-renew.
     * Triggers "Pre-Churn Save" workflow.
     */
    cancelled: async (payload: CancelledPayload): Promise<void> => {
      return this.sendRequest("/events/cancelled", payload);
    },

    /**
     * Call when user turns ON auto-renew (Un-cancelled).
     * Stops "Save" workflow.
     */
    reactivated: async (payload: ReactivatedPayload): Promise<void> => {
      return this.sendRequest("/events/reactivated", payload);
    },

    /**
     * Call when payment fails (Dunning).
     * Triggers "Payment Recovery" workflow.
     */
    paymentFailed: async (payload: PaymentFailedPayload): Promise<void> => {
      return this.sendRequest("/events/payment-failed", payload);
    },

    /**
     * Call when access is fully revoked.
     * Triggers "Win-Back" workflow.
     */
    expired: async (payload: ExpiredPayload): Promise<void> => {
      return this.sendRequest("/events/expired", payload);
    },
  };

  // ----------------------------------------
  // INTERNAL HELPER
  // ----------------------------------------
  private async sendRequest(endpoint: string, data: any): Promise<void> {
    // Ideally use a lightweight fetch wrapper here
    console.log(`[Galva] POST ${endpoint}`, JSON.stringify(data, null, 2));
  }
}
