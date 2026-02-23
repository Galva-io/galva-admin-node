// --- App Store Types ---

export type AppstoreNotificationType =
  | "CONSUMPTION_REQUEST"
  | "DID_CHANGE_RENEWAL_PREF"
  | "DID_CHANGE_RENEWAL_STATUS"
  | "DID_FAIL_TO_RENEW"
  | "DID_RENEW"
  | "EXPIRED"
  | "EXTERNAL_PURCHASE_TOKEN"
  | "GRACE_PERIOD_EXPIRED"
  | "METADATA_UPDATE"
  | "MIGRATION"
  | "OFFER_REDEEMED"
  | "ONE_TIME_CHARGED"
  | "PRICE_CHANGE"
  | "PRICE_INCREASE"
  | "REFUND"
  | "REFUND_DECLINED"
  | "REFUND_REVERSED"
  | "RENEWAL_EXTENDED"
  | "RENEWAL_EXTENSION"
  | "RESCIND_CONSENT"
  | "REVOKE"
  | "SUBSCRIBED"
  | "TEST";

export type AppstoreNotificationSubtype =
  | "ACCEPTED"
  | "ACTIVE_TOKEN_REMINDER"
  | "AUTO_RENEW_DISABLED"
  | "AUTO_RENEW_ENABLED"
  | "BILLING_RECOVERY"
  | "BILLING_RETRY"
  | "CREATED"
  | "DOWNGRADE"
  | "FAILURE"
  | "GRACE_PERIOD"
  | "INITIAL_BUY"
  | "PENDING"
  | "PRICE_INCREASE"
  | "PRODUCT_NOT_FOR_SALE"
  | "RESUBSCRIBE"
  | "SUMMARY"
  | "UPGRADE"
  | "UNREPORTED"
  | "VOLUNTARY";

export type AppstoreEnvironment = "Sandbox" | "Production";

export type AppstoreSubscriptionStatus = 1 | 2 | 3 | 4 | 5;

export type AppstoreInAppOwnershipType = "FAMILY_SHARED" | "PURCHASED";

export type AppstoreDiscountType =
  | "FREE_TRIAL"
  | "PAY_AS_YOU_GO"
  | "PAY_UP_FRONT"
  | "ONE_TIME";

export type AppstoreOfferType = 1 | 2 | 3 | 4;

export type AppstoreOfferPeriod = "P1M" | "P2M" | "P3D";

export type AppstoreRevocationReason = 1 | 2;

export type AppstoreRevocationType =
  | "REFUND_FULL"
  | "REFUND_PRORATED"
  | "FAMILY_REVOKE";

export type AppstoreTransactionReason = "PURCHASE" | "RENEWAL";

export type AppstoreAutoRenewalStatus = 0 | 1;

export type AppstoreExpirationIntent = 1 | 2 | 3 | 4 | 5;

export interface AppstoreTransactionInfo {
  appAccountToken?: string;
  appTransactionId?: string;
  bundleId?: string;
  currency?: string;
  environment?: string;
  expiresDate?: number;
  inAppOwnershipType?: AppstoreInAppOwnershipType;
  isUpgraded?: boolean;
  offerDiscountType?: AppstoreDiscountType;
  offerIdentifier?: string;
  offerPeriod?: AppstoreOfferPeriod;
  offerType?: AppstoreOfferType;
  originalPurchaseDate?: number;
  originalTransactionId?: string;
  previousOriginalTransactionId?: string;
  price?: number;
  productId?: string;
  purchaseDate?: number;
  quantity?: number;
  revocationDate?: number;
  revocationPercentage?: number;
  revocationReason?: AppstoreRevocationReason;
  revocationType?: AppstoreRevocationType;
  signedDate?: number;
  storefront?: string;
  storefrontId?: string;
  subscriptionGroupIdentifier?: string;
  transactionId?: string;
  transactionReason?: AppstoreTransactionReason;
  type?: string;
  webOrderLineItemId?: string;
  advancedCommerceInfo?: Record<string, never>;
}

export interface AppstoreRenewalInfo {
  appAccountToken?: string;
  appTransactionId?: string;
  autoRenewProductId?: string;
  autoRenewStatus?: AppstoreAutoRenewalStatus;
  currency?: string;
  eligibleWinBackOfferIds?: string[];
  environment?: AppstoreEnvironment;
  expirationIntent?: AppstoreExpirationIntent;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  offerDiscountType?: AppstoreDiscountType;
  offerIdentifier?: string;
  offerPeriod?: AppstoreOfferPeriod;
  offerType?: number;
  originalTransactionId?: string;
  priceIncreaseStatus?: AppstoreExpirationIntent;
  productId?: string;
  recentSubscriptionStartDate?: number;
  renewalDate?: number;
  renewalPrice?: number;
  signedDate?: number;
  advancedCommerceInfo?: Record<string, never>;
}

export interface AppstoreWebhookBody {
  notificationType: AppstoreNotificationType;
  subtype?: AppstoreNotificationSubtype;
  data: {
    appAppleId: number;
    bundleId: string;
    bundleVersion: string;
    consumptionRequestReason?: string;
    environment: string;
    renewalInfo?: AppstoreRenewalInfo;
    transactionInfo?: AppstoreTransactionInfo;
    status: AppstoreSubscriptionStatus;
  };
}
