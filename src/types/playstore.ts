export interface PlaystoreOneTimeProductNotification {
  version: string;
  notificationType: number;
  purchaseToken: string;
  sku: string;
}

export interface PlaystoreVoidedPurchaseNotification {
  purchaseToken: string;
  orderId: string;
  productType: number;
  refundType: number;
}

export interface PlaystoreMoney {
  currencyCode?: string;
  units?: string;
  nanos?: number;
}

export interface PlaystorePriceChangeDetails {
  newPrice?: PlaystoreMoney;
  priceChangeMode?: string;
  priceChangeState?: string;
  expectedNewPriceChargeTime?: string;
}

export interface PlaystoreInstallmentDetails {
  initialCommittedPaymentsCount?: number;
  subsequentCommittedPaymentsCount?: number;
  remainingCommittedPaymentsCount?: number;
  pendingCancellation?: Record<string, never>;
}

export interface PlaystoreAutoRenewingPlan {
  autoRenewEnabled?: boolean;
  recurringPrice?: PlaystoreMoney;
  priceChangeDetails?: PlaystorePriceChangeDetails;
  installmentDetails?: PlaystoreInstallmentDetails;
}

export interface PlaystoreOfferPhase {
  freeTrial?: Record<string, never>;
  prorationPeriod?: {
    originalOfferPhaseType?: string;
  };
  introductoryPrice?: Record<string, never>;
  basePrice?: Record<string, never>;
}

export interface PlaystoreOfferDetails {
  offerId?: string;
  offerTags?: string[];
  basePlanId?: string;
}

export interface PlaystorePrepaidPlan {
  allowExtendAfterTime?: string;
}

export interface PlaystoreSignupPromotion {
  oneTimeCode?: Record<string, never>;
  vanityCode?: {
    promotionCode?: string;
  };
}

export interface PlaystoreItemReplacement {
  productId?: string;
  replacementMode?: string;
  basePlanId?: string;
  offerId?: string;
}

export interface PlaystoreSubscriptionPurchaseLineItem {
  productId?: string;
  expiryTime?: string;
  latestSuccessfulOrderId?: string;
  autoRenewingPlan?: PlaystoreAutoRenewingPlan;
  prepaidPlan?: PlaystorePrepaidPlan;
  offerDetails?: PlaystoreOfferDetails;
  offerPhase?: PlaystoreOfferPhase;
  deferredItemReplacement?: {
    productId?: string;
  };
  deferredItemRemoval?: Record<string, never>;
  signupPromotion?: PlaystoreSignupPromotion;
  itemReplacement?: PlaystoreItemReplacement;
}

export interface PlaystoreExternalAccountIdentifiers {
  externalAccountId?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

export interface PlaystoreSubscribeWithGoogleInfo {
  profileId?: string;
  profileName?: string;
  emailAddress?: string;
  givenName?: string;
  familyName?: string;
}

export interface PlaystoreCancelSurveyResult {
  reason?: string;
  reasonUserInput?: string;
}

export interface PlaystoreUserInitiatedCancellation {
  cancelSurveyResult?: PlaystoreCancelSurveyResult;
  cancelTime?: string;
}

export interface PlaystoreCanceledStateContext {
  userInitiatedCancellation?: PlaystoreUserInitiatedCancellation;
  systemInitiatedCancellation?: Record<string, never>;
  developerInitiatedCancellation?: Record<string, never>;
  replacementCancellation?: Record<string, never>;
}

export interface PlaystoreOutOfAppPurchaseContext {
  expiredExternalAccountIdentifiers?: PlaystoreExternalAccountIdentifiers;
  expiredPurchaseToken?: string;
}

export interface PlaystoreSubscriptionPurchaseV2 {
  kind?: string;
  regionCode?: string;
  lineItems?: PlaystoreSubscriptionPurchaseLineItem[];
  startTime?: string;
  subscriptionState?: string;
  latestOrderId?: string;
  linkedPurchaseToken?: string;
  pausedStateContext?: {
    autoResumeTime?: string;
  };
  canceledStateContext?: PlaystoreCanceledStateContext;
  testPurchase?: Record<string, never>;
  acknowledgementState?: string;
  externalAccountIdentifiers?: PlaystoreExternalAccountIdentifiers;
  subscribeWithGoogleInfo?: PlaystoreSubscribeWithGoogleInfo;
  etag?: string;
  outOfAppPurchaseContext?: PlaystoreOutOfAppPurchaseContext;
}

export interface PlaystoreSubscriptionNotification {
  version: string;
  notificationType: number;
  purchaseToken: string;
  subscriptionPurchase: PlaystoreSubscriptionPurchaseV2;
}

export interface PlaystoreTestNotification {
  version: string;
}

export interface PlaystoreDeveloperNotificationBase {
  version: string;
  packageName: string;
  eventTimeMillis: number;
}

export type PlaystoreDeveloperNotification =
  | (PlaystoreDeveloperNotificationBase & {
      subscriptionNotification: PlaystoreSubscriptionNotification;
    })
  | (PlaystoreDeveloperNotificationBase & {
      oneTimeProductNotification: PlaystoreOneTimeProductNotification;
    })
  | (PlaystoreDeveloperNotificationBase & {
      voidedPurchaseNotification: PlaystoreVoidedPurchaseNotification;
    })
  | (PlaystoreDeveloperNotificationBase & {
      testNotification: PlaystoreTestNotification;
    });
