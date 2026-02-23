export type EndUserSourceType =
  | "profile"
  | "product"
  | "plan"
  | "product-billing"
  | "entitlement";

export type BillingPlatformType = "appstore" | "playstore" | "paddle";

export type BillingEventType =
  | "initial-purchase"
  | "resubscribe"
  | "non-renewing-purchase"
  | "renewal"
  | "recover"
  | "product-change"
  | "cancellation"
  | "billing-issue"
  | "subscriber-alias"
  | "subscription-paused"
  | "uncancellation"
  | "transfer"
  | "subscription-extended"
  | "expiration"
  | "refund"
  | "upgraded"
  | "grace_period_start";
