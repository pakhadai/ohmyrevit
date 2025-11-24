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
  bonus_balance: number;
  bonus_streak: number;
  last_bonus_claim_date?: string;
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
  file_size_mb: number;
  compatibility: string;
  categories: Category[];
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