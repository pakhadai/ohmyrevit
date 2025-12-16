// frontend/types/index.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code: string;
  photo_url?: string;
  email?: string;
  is_admin: boolean;
  balance: number;  // CHANGED: bonus_balance -> balance (OMR Coins)
  bonus_streak: number;
  last_bonus_claim_date?: string;
  referral_code?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  product_type: 'free' | 'premium';
  main_image_url: string;
  gallery_image_urls: string[];
  is_on_sale: boolean;
  sale_price?: number;
  actual_price?: number;
  file_size_mb: number;
  compatibility: string;
  categories: Category[];
  views_count?: number;
  downloads_count?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Language = 'uk' | 'en' | 'ru';
export type Theme = 'light' | 'dark';

export interface Collection {
  id: number;
  name: string;
  color: string;
  created_at: string;
  products_count: number;
}

export interface ProductInCollection {
  id: number;
  title: string;
  description: string;
  main_image_url: string;
  price: number;
  product_type: string;
}

export interface CollectionDetail extends Collection {
  products: ProductInCollection[];
}

// ============ Wallet Types (NEW) ============

export interface CoinPack {
  id: number;
  name: string;
  price_usd: number;
  coins_amount: number;
  bonus_percent: number;
  total_coins: number;
  gumroad_permalink: string;
  gumroad_url: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export type TransactionType = 'deposit' | 'purchase' | 'subscription' | 'bonus' | 'refund' | 'referral';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description?: string;
  order_id?: number;
  subscription_id?: number;
  external_id?: string;
  created_at: string;
}

export interface WalletInfo {
  balance: number;
  balance_usd: number;
  coin_packs: CoinPack[];
  recent_transactions: Transaction[];
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
}

// ============ Order Types (Updated) ============

export interface CheckoutResponse {
  success: boolean;
  order_id: number;
  coins_spent: number;
  new_balance: number;
  message: string;
  payment_url?: string;  // Deprecated
}

export interface InsufficientFundsError {
  error: 'insufficient_funds';
  required_coins: number;
  current_balance: number;
  shortfall: number;
  message: string;
}

export interface ApplyDiscountResponse {
  success: boolean;
  subtotal_coins: number;
  discount_coins: number;
  final_coins: number;
  user_balance: number;
  has_enough_balance: boolean;
  message?: string;
}

// ============ Subscription Types (Updated) ============

export interface SubscriptionStatus {
  has_active_subscription: boolean;
  subscription?: {
    id: number;
    start_date: string;
    end_date: string;
    days_remaining: number;
    is_auto_renewal: boolean;
  };
}

export interface SubscriptionCheckoutResponse {
  success: boolean;
  subscription_id: number;
  coins_spent: number;
  new_balance: number;
  is_extension: boolean;
  end_date: string;
  message: string;
}

export interface SubscriptionPriceInfo {
  price_coins: number;
  price_usd: number;
  user_balance: number;
  has_enough_balance: boolean;
  shortfall: number;
}