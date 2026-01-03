// frontend/types/index.ts

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: number;
  telegramId?: number;
  username?: string;
  firstName: string;
  lastName?: string;
  birthDate?: string;
  languageCode: string;
  photoUrl?: string;
  email?: string;
  isAdmin: boolean;
  is_creator?: boolean;
  balance: number;
  bonusStreak: number;
  lastBonusClaimDate?: string;
  referralCode?: string;
  isEmailVerified?: boolean;
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
  author_id?: number;
  author_name?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Language = 'uk' | 'en' | 'ru' | 'de' | 'es';
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

export interface CoinPack {
  id: number;
  name: string;
  price_usd: number;
  coins_amount: number;
  bonus_percent: number;
  total_coins: number;
  stripe_price_id: string;
  description?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

export interface StripePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface StripeConfigResponse {
  publishable_key: string;
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

export interface CheckoutResponse {
  success: boolean;
  order_id: number;
  coins_spent: number;
  new_balance: number;
  message: string;
  payment_url?: string;
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

export interface AuthResponse {
  accessToken?: string;
  access_token?: string;
  user: any;
  isNewUser?: boolean;
  is_new_user?: boolean;
  needsRegistration?: boolean;
}