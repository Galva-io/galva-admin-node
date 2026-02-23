// --- Paddle Types ---

export interface PaddleTimePeriod {
  starts_at?: string;
  ends_at?: string;
}

export interface PaddleDuration {
  interval?: string;
  frequency?: number;
}

export interface PaddleUnitPrice {
  amount?: string;
  currency_code?: string;
}

export interface PaddleUnitPriceOverride {
  country_codes?: string[];
  unit_price?: PaddleUnitPrice;
}

export interface PaddleQuantity {
  minimum?: number;
  maximum?: number;
}

export interface PaddleImportMeta {
  imported_from?: string;
  external_id?: string;
}

export type PaddleCustomData = Record<string, unknown>;

export interface PaddleSubscriptionDiscount {
  id?: string;
  starts_at?: string;
  ends_at?: string | null;
}

export interface PaddleScheduledChange {
  action?: string;
  effective_at?: string;
  resume_at?: string | null;
}

export interface PaddleBillingDetails {
  enable_checkout?: boolean;
  purchase_order_number?: string;
  additional_information?: string;
  payment_terms?: PaddleDuration;
}

export interface PaddleManagementUrls {
  update_payment_method?: string | null;
  cancel?: string;
}

// --- Paddle Product/Price Types ---

export interface PaddleProduct {
  id?: string;
  name?: string;
  description?: string | null;
  type?: string;
  tax_category?: string;
  image_url?: string | null;
  custom_data?: PaddleCustomData | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  import_meta?: PaddleImportMeta | null;
}

export interface PaddlePrice {
  id?: string;
  product_id?: string;
  name?: string | null;
  description?: string;
  type?: string;
  billing_cycle?: PaddleDuration | null;
  trial_period?: PaddleDuration | null;
  tax_mode?: string;
  unit_price?: PaddleUnitPrice;
  unit_price_overrides?: PaddleUnitPriceOverride[];
  quantity?: PaddleQuantity;
  status?: string;
  custom_data?: PaddleCustomData | null;
  import_meta?: PaddleImportMeta | null;
  product?: PaddleProduct;
}

// --- Paddle Subscription Types ---

export interface PaddleSubscriptionItem {
  status?: string;
  quantity?: number;
  recurring?: boolean;
  created_at?: string;
  updated_at?: string;
  previously_billed_at?: string | null;
  next_billed_at?: string | null;
  trial_dates?: PaddleTimePeriod | null;
  price?: PaddlePrice;
}

export interface PaddleSubscription {
  id?: string;
  status?: string;
  customer_id?: string;
  address_id?: string;
  currency_code?: string;
  created_at?: string;
  updated_at?: string;
  billing_cycle?: PaddleDuration;
  items?: PaddleSubscriptionItem[];
  business_id?: string | null;
  started_at?: string | null;
  first_billed_at?: string | null;
  next_billed_at?: string | null;
  paused_at?: string | null;
  canceled_at?: string | null;
  discount?: PaddleSubscriptionDiscount | null;
  collection_mode?: string;
  billing_details?: PaddleBillingDetails | null;
  current_billing_period?: PaddleTimePeriod | null;
  scheduled_change?: PaddleScheduledChange | null;
  custom_data?: PaddleCustomData | null;
  management_urls?: PaddleManagementUrls;
  import_meta?: PaddleImportMeta | null;
  transaction_id?: string;
}

// --- Paddle Transaction Types ---

export interface PaddlePaymentMethodDetails {
  type?: string;
  card?: {
    type?: string;
    last4?: string;
    expiry_month?: number;
    expiry_year?: number;
    cardholder_name?: string;
  } | null;
}

export interface PaddlePayment {
  payment_attempt_id?: string;
  payment_method_id?: string;
  amount?: string;
  status?: string;
  error_code?: string | null;
  method_details?: PaddlePaymentMethodDetails;
  created_at?: string;
  captured_at?: string | null;
}

export interface PaddleTransactionTotals {
  subtotal?: string;
  discount?: string;
  tax?: string;
  total?: string;
  credit?: string;
  credit_to_balance?: string;
  balance?: string;
  grand_total?: string;
  fee?: string | null;
  earnings?: string | null;
  currency_code?: string;
}

export interface PaddleTransactionDetails {
  tax_rates_used?: Array<{
    tax_rate?: string;
    totals?: PaddleTransactionTotals;
  }>;
  totals?: PaddleTransactionTotals;
  adjusted_totals?: PaddleTransactionTotals | null;
  payout_totals?: PaddleTransactionTotals | null;
  adjusted_payout_totals?: PaddleTransactionTotals | null;
  line_items?: unknown[];
}

export interface PaddleCheckout {
  url?: string | null;
}

export interface PaddleTransactionItem {
  price?: PaddlePrice;
  quantity?: number;
  proration?: {
    rate?: string;
    billing_period?: PaddleTimePeriod;
  } | null;
}

export interface PaddleTransaction {
  id?: string;
  status?: string;
  customer_id?: string | null;
  address_id?: string | null;
  business_id?: string | null;
  currency_code?: string;
  origin?: string;
  subscription_id?: string | null;
  invoice_id?: string | null;
  invoice_number?: string | null;
  collection_mode?: string;
  discount_id?: string | null;
  billing_details?: PaddleBillingDetails | null;
  billing_period?: PaddleTimePeriod | null;
  items?: PaddleTransactionItem[];
  details?: PaddleTransactionDetails;
  payments?: PaddlePayment[];
  checkout?: PaddleCheckout | null;
  custom_data?: PaddleCustomData | null;
  created_at?: string;
  updated_at?: string;
  billed_at?: string | null;
}

// --- Paddle Webhook Event Types ---

export interface PaddleSubscriptionEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  notification_id?: string;
  data?: PaddleSubscription;
}

export interface PaddleTransactionEvent {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  notification_id?: string;
  data?: PaddleTransaction;
}

export type PaddleWebhookBody = PaddleSubscriptionEvent | PaddleTransactionEvent;
