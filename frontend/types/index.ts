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
  balance: number;
  bonusStreak: number;
  lastBonusClaimDate?: string;
  referralCode?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  productType: 'free' | 'premium';
  mainImageUrl: string;
  galleryImageUrls: string[];
  isOnSale: boolean;
  salePrice?: number;
  actualPrice?: number;
  fileSizeMb: number;
  compatibility: string;
  categories: Category[];
  viewsCount?: number;
  downloadsCount?: number;
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
  createdAt: string;
  productsCount: number;
}

export interface ProductInCollection {
  id: number;
  title: string;
  description: string;
  mainImageUrl: string;
  price: number;
  productType: string;
}

export interface CollectionDetail extends Collection {
  products: ProductInCollection[];
}

export interface CoinPack {
  id: number;
  name: string;
  priceUsd: number;
  coinsAmount: number;
  bonusPercent: number;
  totalCoins: number;
  gumroadPermalink: string;
  gumroadUrl: string;
  description?: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
}

export type TransactionType = 'deposit' | 'purchase' | 'subscription' | 'bonus' | 'refund' | 'referral';

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  orderId?: number;
  subscriptionId?: number;
  externalId?: string;
  createdAt: string;
}

export interface WalletInfo {
  balance: number;
  balanceUsd: number;
  coinPacks: CoinPack[];
  recentTransactions: Transaction[];
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  size: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  isNewUser: boolean;
  needsRegistration: boolean;
}

export interface CheckoutResponse {
  success: boolean;
  orderId: number;
  coinsSpent: number;
  newBalance: number;
  message: string;
}

export interface ApplyDiscountResponse {
  success: boolean;
  subtotalCoins: number;
  discountCoins: number;
  finalCoins: number;
  userBalance: number;
  hasEnoughBalance: boolean;
  message?: string;
}

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  subscription?: {
    id: number;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    isAutoRenewal: boolean;
  };
}

export interface SubscriptionCheckoutResponse {
  success: boolean;
  subscriptionId: number;
  coinsSpent: number;
  newBalance: number;
  isExtension: boolean;
  endDate: string;
  message: string;
}

export interface SubscriptionPriceInfo {
  priceCoins: number;
  priceUsd: number;
  userBalance: number;
  hasEnoughBalance: boolean;
  shortfall: number;
}