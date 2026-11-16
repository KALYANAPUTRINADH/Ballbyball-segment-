export type StoreDomain =
  | 'Cricket'
  | 'Team Sports'
  | 'Racket & Court'
  | 'Fitness & Athletics'
  | 'Indoor & Board Games'
  | 'Esports & Gaming'
  | 'Sports'
  | 'Indoor & Games';

export type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

export interface StoreProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  domain: StoreDomain;
  category: string;
  sport_type: string;
  price_usd: number;
  mrp_usd: number;
  price_inr: number;
  mrp_inr: number;
  stock: number;
  image_url: string;
  description: string;
  sizes: string[];
  handedness_options?: string[];
  knocking_available?: boolean;
  knocking_fee_usd?: number;
  knocking_fee_inr?: number;
  custom_print_available?: boolean;
  authenticity_prefix?: string;
  specs: Record<string, string>;
  highlights: string[];
  rating: number;
  review_count: number;
  units_ordered?: number;
  low_stock_threshold?: number;
  featured?: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreWishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface CartItem {
  cartKey: string;
  product: StoreProduct;
  quantity: number;
  selectedSize: string;
  selectedHand?: string;
  includeKnocking?: boolean;
  customJerseyName?: string;
  customJerseyNumber?: string;
}

export interface StoreOrderItem {
  product_id: string;
  sku: string;
  name: string;
  brand: string;
  quantity: number;
  selected_size: string;
  selected_hand?: string;
  include_knocking?: boolean;
  custom_print?: string;
  unit_price: number;
}

export interface StoreShippingAddress {
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface StoreOrder {
  id: string;
  order_number: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: StoreShippingAddress;
  items: StoreOrderItem[];
  currency: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code?: string;
  payment_method: 'stripe' | 'razorpay' | 'cod' | 'bank_transfer' | 'upi' | 'paypal' | 'custom_qr';
  payment_status: 'paid' | 'pending_cod' | 'awaiting_verification' | 'failed';
  payment_reference?: string;
  payer_bank_name?: string;
  receiving_account_id?: string;
  receiving_account_label?: string;
  checkout_mode?: 'quick_buy' | 'cart_checkout';
  status: OrderStatus;
  tracking_number?: string;
  created_at: string;
  updated_at: string;
}

export interface StoreReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  verified_order_number?: string;
  created_at: string;
  updated_at?: string;
}

export interface StoreCoupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'flat';
  value: number;
  min_order_usd: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface StoreBrand {
  id: string;
  name: string;
  domain: 'All' | StoreDomain;
  origin?: string;
  authenticity_prefix?: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StoreAlertScope = 'popular_cricket' | 'all_cricket' | 'all_popular' | 'all_catalog';
export type StoreAlertSeverity = 'out_of_stock' | 'critical' | 'low';
export type StoreAlertStatus = 'active' | 'acknowledged' | 'resolved';

export interface StoreAlertConfig {
  id: string;
  enabled: boolean;
  scope: StoreAlertScope;
  popular_threshold: number;
  default_threshold: number;
  popular_min_units_ordered: number;
  sync_to_global_bell: boolean;
  toast_on_trigger: boolean;
  updated_by?: string;
  updated_at: string;
}

export interface StoreStockAlert {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  brand: string;
  domain: string;
  sport_type: string;
  current_stock: number;
  threshold: number;
  severity: StoreAlertSeverity;
  status: StoreAlertStatus;
  is_read: boolean;
  is_popular: boolean;
  popularity_reason: string;
  units_ordered: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export type StoreRestockStatus = 'waiting' | 'notified' | 'cancelled';

export interface StoreRestockRequest {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  brand: string;
  email: string;
  user_id?: string;
  user_name?: string;
  status: StoreRestockStatus;
  created_at: string;
  updated_at: string;
  notified_at?: string;
  last_stock_notified?: number;
}

export type SavedPaymentProvider = 'stripe_card' | 'razorpay_upi' | 'cod' | 'bank_transfer' | 'upi' | 'paypal' | 'custom_qr';

export type StorePayoutAccountType = 'bank_transfer' | 'razorpay' | 'upi' | 'stripe' | 'paypal' | 'custom_qr';

export interface StorePayoutAccount {
  id: string;
  label: string;
  account_type: StorePayoutAccountType;
  account_holder_name: string;
  bank_name?: string;
  account_number?: string;
  ifsc_or_routing?: string;
  branch_name?: string;
  upi_id?: string;
  paypal_handle?: string;
  payment_link?: string;
  qr_payload?: string;
  qr_code_url?: string;
  razorpay_key_id?: string;
  razorpay_account_id?: string;
  currency_scope: 'INR' | 'USD' | 'ALL';
  instructions?: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSavedPaymentMethod {
  id: string;
  user_id: string;
  provider: SavedPaymentProvider;
  label: string;
  brand?: string;
  last4?: string;
  expiry?: string;
  is_default: boolean;
  created_at: string;
}

export interface StoreSavedAddress {
  name: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export type StoreAnalyticsEventType =
  | 'store_view'
  | 'product_view'
  | 'add_to_cart'
  | 'quick_buy_open'
  | 'checkout_start'
  | 'order_completed';

export interface StoreAnalyticsEvent {
  id: string;
  event_type: StoreAnalyticsEventType;
  product_id?: string;
  product_name?: string;
  brand?: string;
  domain?: string;
  sport_type?: string;
  checkout_mode?: 'quick_buy' | 'cart_checkout';
  session_id: string;
  user_id: string;
  revenue_usd?: number;
  units?: number;
  created_at: string;
}
