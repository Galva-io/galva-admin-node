import { BillingPlatformType } from "./enums";
import { RawBillingEvent } from "./raw-events";

export interface BillingTransaction {
  amount: number;
  currency: string;
  amountInUsd: number;
  usdRate: number;
}

interface BillingEventBase {
  id: string;
  originalTransactionId?: string;
  transactionId?: string;
  endUserId: string;
  endUserEmail?: string;
  appIdentifier: string;
  productIdentifier: string;
  planIdentifier: string;
  platform: BillingPlatformType;
  eventTimestamp: string;
  transaction?: BillingTransaction;
}

export interface BillingInitialPurchaseEvent extends BillingEventBase {
  type: "initial-purchase";
  purchasedAt: string;
  expiresAt?: string;
  isTrial?: boolean;
}

export interface BillingRenewalEvent extends BillingEventBase {
  type: "renewal";
  purchasedAt: string;
  expiresAt?: string;
  isCollectiveSharing?: boolean;
}

export interface BillingCancellationEvent extends BillingEventBase {
  type: "cancellation";
  expiresAt?: string;
  cancelReason: string;
}

export interface BillingIssueEvent extends BillingEventBase {
  type: "billing-issue";
  expiresAt?: string;
}

export interface BillingExpirationEvent extends BillingEventBase {
  type: "expiration";
  expirationReason: string;
}

export interface BillingUpgradedEvent extends BillingEventBase {
  type: "upgraded";
  fromPlanId: string;
  toPlanId: string;
  expiresAt?: string;
}

export interface BillingRefundedEvent extends BillingEventBase {
  type: "refund";
  reason: string;
}

export interface BillingResubscribeEvent extends BillingEventBase {
  type: "resubscribe";
  purchasedAt: string;
  expiresAt?: string;
}

export interface BillingTransferEvent extends BillingEventBase {
  type: "transfer";
  fromAppUserId: string;
  toAppUserId: string;
}

export interface BillingGracePeriodStartEvent extends BillingEventBase {
  type: "grace_period_start";
  expiresAt?: string;
}

export interface BillingRecoverEvent extends BillingEventBase {
  type: "recover";
  purchasedAt: string;
  expiresAt?: string;
}

export type BillingEvent =
  | BillingInitialPurchaseEvent
  | BillingRenewalEvent
  | BillingCancellationEvent
  | BillingIssueEvent
  | BillingExpirationEvent
  | BillingUpgradedEvent
  | BillingRefundedEvent
  | BillingResubscribeEvent
  | BillingTransferEvent
  | BillingGracePeriodStartEvent
  | BillingRecoverEvent;

export type SyncBillingEventPayload =
  | { type: "standard"; event: BillingEvent }
  | { type: "raw"; event: RawBillingEvent };
