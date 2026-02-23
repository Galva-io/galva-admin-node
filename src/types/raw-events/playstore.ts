export interface PlaystoreDeveloperNotification {
  version?: string;
  packageName?: string;
  eventTimeMillis?: number;
  subscriptionNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
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
      subscriptionState?: string;
      latestOrderId?: string;
      linkedPurchaseToken?: string;
      acknowledgementState?: string;
    };
  };
  oneTimeProductNotification?: {
    version?: string;
    notificationType?: number;
    purchaseToken?: string;
    sku?: string;
  };
  voidedPurchaseNotification?: {
    purchaseToken?: string;
    orderId?: string;
    productType?: number;
    refundType?: number;
  };
  testNotification?: {
    version?: string;
  };
}
