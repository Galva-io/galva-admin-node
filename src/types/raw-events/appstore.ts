// --- App Store Types ---

export interface AppstoreTransactionInfo {
  appAccountToken?: string;
  appTransactionId?: string;
  bundleId?: string;
  currency?: string;
  environment?: string;
  expiresDate?: number;
  inAppOwnershipType?: string;
  isUpgraded?: boolean;
  offerDiscountType?: string;
  offerIdentifier?: string;
  offerPeriod?: string;
  offerType?: number;
  originalPurchaseDate?: number;
  originalTransactionId?: string;
  previousOriginalTransactionId?: string;
  price?: number;
  productId?: string;
  purchaseDate?: number;
  quantity?: number;
  revocationDate?: number;
  revocationPercentage?: number;
  revocationReason?: number;
  revocationType?: string;
  signedDate?: number;
  storefront?: string;
  storefrontId?: string;
  subscriptionGroupIdentifier?: string;
  transactionId?: string;
  transactionReason?: string;
  type?: string;
  webOrderLineItemId?: string;
  advancedCommerceInfo?: Record<string, never>;
}

export interface AppstoreRenewalInfo {
  appAccountToken?: string;
  appTransactionId?: string;
  autoRenewProductId?: string;
  autoRenewStatus?: number;
  currency?: string;
  eligibleWinBackOfferIds?: string[];
  environment?: string;
  expirationIntent?: number;
  gracePeriodExpiresDate?: number;
  isInBillingRetryPeriod?: boolean;
  offerDiscountType?: string;
  offerIdentifier?: string;
  offerPeriod?: string;
  offerType?: number;
  originalTransactionId?: string;
  priceIncreaseStatus?: number;
  productId?: string;
  recentSubscriptionStartDate?: number;
  renewalDate?: number;
  renewalPrice?: number;
  signedDate?: number;
  advancedCommerceInfo?: Record<string, never>;
}

export interface AppstoreWebhookBody {
  notificationType?: string;
  subtype?: string;
  data?: {
    appAppleId?: number;
    bundleId?: string;
    bundleVersion?: string;
    consumptionRequestReason?: string;
    environment?: string;
    renewalInfo?: AppstoreRenewalInfo;
    transactionInfo?: AppstoreTransactionInfo;
    status?: number;
  };
}
