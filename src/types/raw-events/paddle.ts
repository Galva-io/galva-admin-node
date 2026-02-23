// --- Paddle Types ---

export type PaddleSubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "paused"
  | "trialing";

export type PaddleSubscriptionItemStatus = "active" | "inactive" | "trialing";

export type PaddleCollectionMode = "automatic" | "manual";

export type PaddleInterval = "day" | "week" | "month" | "year";

export type PaddleScheduledChangeAction = "cancel" | "pause" | "resume";

export type PaddlePriceType = "custom" | "standard";

export type PaddleEntityStatus = "active" | "archived";

export type PaddleTaxMode =
  | "account_setting"
  | "external"
  | "internal"
  | "location";

export type PaddleProductType = "custom" | "standard";

export type PaddleTaxCategory =
  | "digital-goods"
  | "ebooks"
  | "implementation-services"
  | "professional-services"
  | "saas"
  | "software-programming-services"
  | "standard"
  | "training-services"
  | "website-hosting";

export type PaddleCurrencyCode =
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AUD"
  | "CAD"
  | "CHF"
  | "HKD"
  | "SGD"
  | "SEK"
  | "ARS"
  | "BRL"
  | "CNY"
  | "COP"
  | "CZK"
  | "DKK"
  | "HUF"
  | "ILS"
  | "INR"
  | "KRW"
  | "MXN"
  | "NOK"
  | "NZD"
  | "PLN"
  | "RUB"
  | "THB"
  | "TRY"
  | "TWD"
  | "UAH"
  | "VND"
  | "ZAR";

export type PaddleSubscriptionEventType =
  | "subscription.activated"
  | "subscription.canceled"
  | "subscription.created"
  | "subscription.imported"
  | "subscription.past_due"
  | "subscription.paused"
  | "subscription.resumed"
  | "subscription.trialing"
  | "subscription.updated";

export type PaddleTransactionEventType =
  | "transaction.billed"
  | "transaction.canceled"
  | "transaction.completed"
  | "transaction.created"
  | "transaction.paid"
  | "transaction.past_due"
  | "transaction.payment_failed"
  | "transaction.ready"
  | "transaction.updated";

export type PaddleTransactionStatus =
  | "draft"
  | "ready"
  | "billed"
  | "paid"
  | "completed"
  | "canceled"
  | "past_due";

export type PaddleTransactionOrigin =
  | "api"
  | "subscription_charge"
  | "subscription_payment_method_change"
  | "subscription_recurring"
  | "subscription_update"
  | "web";

export type PaddlePaymentStatus =
  | "authorized"
  | "authorized_flagged"
  | "canceled"
  | "captured"
  | "error"
  | "action_required"
  | "pending_no_action_required"
  | "created"
  | "unknown"
  | "dropped";

export type PaddlePaymentErrorCode =
  | "already_canceled"
  | "authentication_failed"
  | "blocked_card"
  | "declined"
  | "declined_not_retryable"
  | "expired_card"
  | "fraud"
  | "invalid_amount"
  | "issuer_unavailable"
  | "not_enough_balance"
  | "psp_error"
  | "system_error"
  | "unknown";

// --- Paddle Shared Types ---

export interface PaddleTimePeriod {
  starts_at: string;
  ends_at: string;
}

export interface PaddleDuration {
  interval: PaddleInterval;
  frequency: number;
}

export interface PaddleUnitPrice {
  amount: string;
  currency_code: PaddleCurrencyCode;
}

export interface PaddleUnitPriceOverride {
  country_codes: string[];
  unit_price: PaddleUnitPrice;
}

export interface PaddleQuantity {
  minimum: number;
  maximum: number;
}

export interface PaddleImportMeta {
  imported_from: string;
  external_id?: string;
}

export type PaddleCustomData = Record<string, unknown>;

export interface PaddleSubscriptionDiscount {
  id: string;
  starts_at: string;
  ends_at: string | null;
}

export interface PaddleScheduledChange {
  action: PaddleScheduledChangeAction;
  effective_at: string;
  resume_at?: string | null;
}

export interface PaddleBillingDetails {
  enable_checkout?: boolean;
  purchase_order_number?: string;
  additional_information?: string;
  payment_terms?: PaddleDuration;
}

export interface PaddleManagementUrls {
  update_payment_method: string | null;
  cancel: string;
}

// --- Paddle Product/Price Types ---

export interface PaddleProduct {
  id: string;
  name: string;
  description?: string | null;
  type: PaddleProductType;
  tax_category: PaddleTaxCategory;
  image_url?: string | null;
  custom_data: PaddleCustomData | null;
  status: PaddleEntityStatus;
  created_at: string;
  updated_at: string;
  import_meta?: PaddleImportMeta | null;
}

export interface PaddlePrice {
  id: string;
  product_id: string;
  name?: string | null;
  description: string;
  type: PaddlePriceType;
  billing_cycle: PaddleDuration | null;
  trial_period: PaddleDuration | null;
  tax_mode: PaddleTaxMode;
  unit_price: PaddleUnitPrice;
  unit_price_overrides: PaddleUnitPriceOverride[];
  quantity: PaddleQuantity;
  status: PaddleEntityStatus;
  custom_data: PaddleCustomData | null;
  import_meta?: PaddleImportMeta | null;
  product?: PaddleProduct;
}

// --- Paddle Subscription Types ---

export interface PaddleSubscriptionItem {
  status: PaddleSubscriptionItemStatus;
  quantity: number;
  recurring: boolean;
  created_at: string;
  updated_at: string;
  previously_billed_at: string | null;
  next_billed_at: string | null;
  trial_dates: PaddleTimePeriod | null;
  price: PaddlePrice;
}

export interface PaddleSubscription {
  id: string;
  status: PaddleSubscriptionStatus;
  customer_id: string;
  address_id: string;
  currency_code: PaddleCurrencyCode;
  created_at: string;
  updated_at: string;
  billing_cycle: PaddleDuration;
  items: PaddleSubscriptionItem[];
  business_id: string | null;
  started_at: string | null;
  first_billed_at: string | null;
  next_billed_at: string | null;
  paused_at: string | null;
  canceled_at: string | null;
  discount: PaddleSubscriptionDiscount | null;
  collection_mode: PaddleCollectionMode;
  billing_details: PaddleBillingDetails | null;
  current_billing_period: PaddleTimePeriod | null;
  scheduled_change: PaddleScheduledChange | null;
  custom_data: PaddleCustomData | null;
  management_urls?: PaddleManagementUrls;
  import_meta?: PaddleImportMeta | null;
  transaction_id?: string;
}

// --- Paddle Transaction Types ---

export interface PaddlePaymentMethodDetails {
  type: string;
  card?: {
    type?: string;
    last4?: string;
    expiry_month?: number;
    expiry_year?: number;
    cardholder_name?: string;
  } | null;
}

export interface PaddlePayment {
  payment_attempt_id: string;
  payment_method_id?: string;
  amount: string;
  status: PaddlePaymentStatus;
  error_code?: PaddlePaymentErrorCode | null;
  method_details?: PaddlePaymentMethodDetails;
  created_at: string;
  captured_at: string | null;
}

export interface PaddleTransactionTotals {
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  credit?: string;
  credit_to_balance?: string;
  balance?: string;
  grand_total?: string;
  fee?: string | null;
  earnings?: string | null;
  currency_code: PaddleCurrencyCode;
}

export interface PaddleTransactionDetails {
  tax_rates_used?: Array<{
    tax_rate: string;
    totals?: PaddleTransactionTotals;
  }>;
  totals?: PaddleTransactionTotals;
  adjusted_totals?: PaddleTransactionTotals | null;
  payout_totals?: PaddleTransactionTotals | null;
  adjusted_payout_totals?: PaddleTransactionTotals | null;
  line_items?: unknown[];
}

export interface PaddleCheckout {
  url: string | null;
}

export interface PaddleTransactionItem {
  price: PaddlePrice;
  quantity: number;
  proration?: {
    rate: string;
    billing_period: PaddleTimePeriod;
  } | null;
}

export interface PaddleTransaction {
  id: string;
  status: PaddleTransactionStatus;
  customer_id: string | null;
  address_id: string | null;
  business_id: string | null;
  currency_code: PaddleCurrencyCode;
  origin: PaddleTransactionOrigin;
  subscription_id: string | null;
  invoice_id?: string | null;
  invoice_number: string | null;
  collection_mode: PaddleCollectionMode;
  discount_id: string | null;
  billing_details: PaddleBillingDetails | null;
  billing_period: PaddleTimePeriod | null;
  items: PaddleTransactionItem[];
  details?: PaddleTransactionDetails;
  payments?: PaddlePayment[];
  checkout?: PaddleCheckout | null;
  custom_data: PaddleCustomData | null;
  created_at: string;
  updated_at: string;
  billed_at: string | null;
}

// --- Paddle Webhook Event Types ---

export interface PaddleSubscriptionEvent {
  event_id: string;
  event_type: PaddleSubscriptionEventType;
  occurred_at: string;
  notification_id: string;
  data: PaddleSubscription;
}

export interface PaddleTransactionEvent {
  event_id: string;
  event_type: PaddleTransactionEventType;
  occurred_at: string;
  notification_id: string;
  data: PaddleTransaction;
}

export type PaddleWebhookBody = PaddleSubscriptionEvent | PaddleTransactionEvent;
