export type PlaystoreSubscriptionNotificationType =
  | 1 // SUBSCRIPTION_RECOVERED
  | 2 // SUBSCRIPTION_RENEWED
  | 3 // SUBSCRIPTION_CANCELED
  | 4 // SUBSCRIPTION_PURCHASED
  | 5 // SUBSCRIPTION_ON_HOLD
  | 6 // SUBSCRIPTION_IN_GRACE_PERIOD
  | 7 // SUBSCRIPTION_RESTARTED
  | 8 // SUBSCRIPTION_PRICE_CHANGE_CONFIRMED
  | 9 // SUBSCRIPTION_DEFERRED
  | 10 // SUBSCRIPTION_PAUSED
  | 11 // SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED
  | 12 // SUBSCRIPTION_REVOKED
  | 13; // SUBSCRIPTION_EXPIRED

export type PlaystoreSubscriptionState =
  | "SUBSCRIPTION_STATE_UNSPECIFIED"
  | "SUBSCRIPTION_STATE_PENDING"
  | "SUBSCRIPTION_STATE_ACTIVE"
  | "SUBSCRIPTION_STATE_PAUSED"
  | "SUBSCRIPTION_STATE_IN_GRACE_PERIOD"
  | "SUBSCRIPTION_STATE_ON_HOLD"
  | "SUBSCRIPTION_STATE_CANCELED"
  | "SUBSCRIPTION_STATE_EXPIRED";

export interface PlaystoreDeveloperNotification {
  version: string;
  packageName: string;
  eventTimeMillis: number;
  subscriptionNotification?: {
    version: string;
    notificationType: PlaystoreSubscriptionNotificationType;
    purchaseToken: string;
    subscriptionPurchase?: {
      kind?: string;
      regionCode?: string;
      lineItems?: Array<{
        productId?: string;
        expiryTime?: string;
        autoRenewingPlan?: {
          autoRenewEnabled?: boolean;
        };
      }>;
      startTime?: string;
      subscriptionState?: PlaystoreSubscriptionState;
      latestOrderId?: string;
      linkedPurchaseToken?: string;
      acknowledgementState?: string;
    };
  };
  oneTimeProductNotification?: {
    version: string;
    notificationType: number;
    purchaseToken: string;
    sku: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken: string;
    orderId: string;
    productType: number;
    refundType: number;
  };
  testNotification?: {
    version: string;
  };
}
