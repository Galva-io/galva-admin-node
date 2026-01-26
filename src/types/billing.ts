export type BillingEventType = 
  | 'initial-purchase'
  | 'renewal'
  | 'cancellation'
  | 'billing-issue'
  | 'expiration'
  | 'upgraded'
  | 'refund'
  | 'resubscribe'
  | 'transfer'
  | 'grace_period_start';

export type BillingPlatformType = 
  | 'ios'
  | 'android'
  | 'stripe'
  | 'manual'
  | 'web';

export interface BillingBaseEvent {
  id: string;
  originalTransactionId?: string;
  transactionId?: string;
  endUserId: string;
  endUserEmail?: string;
  appIdentifier: string;
  productIdentifier: string;
  planIdentifier: string;
  type: BillingEventType;
  platform: BillingPlatformType;
  eventTimestamp: string;
}

export interface BillingInitialPurchaseEvent extends BillingBaseEvent {
  type: 'initial-purchase';
  purchasedAt: string;
  expiresAt?: string;
  isTrial?: boolean;
}

export interface BillingRenewalEvent extends BillingBaseEvent {
  type: 'renewal';
  purchasedAt: string;
  expiresAt?: string;
  isCollectiveSharing?: boolean;
}

export interface BillingCancellationEvent extends BillingBaseEvent {
  type: 'cancellation';
  expiresAt?: string;
  cancelReason: string;
}

export interface BillingIssueEvent extends BillingBaseEvent {
  type: 'billing-issue';
  expiresAt?: string;
}

export interface BillingExpirationEvent extends BillingBaseEvent {
  type: 'expiration';
  expirationReason: string;
}

export interface BillingUpgradedEvent extends BillingBaseEvent {
  type: 'upgraded';
  fromPlanId: string;
  toPlanId: string;
  expiresAt?: string;
}

export interface BillingRefundedEvent extends BillingBaseEvent {
  type: 'refund';
  reason: string;
}

export interface BillingResubscribeEvent extends BillingBaseEvent {
  type: 'resubscribe';
  purchasedAt: string;
  expiresAt?: string;
}

export interface BillingTransferEvent extends BillingBaseEvent {
  type: 'transfer';
  fromAppUserId: string;
  toAppUserId: string;
}

export interface BillingGracePeriodStartEvent extends BillingBaseEvent {
  type: 'grace_period_start';
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
  | BillingGracePeriodStartEvent;