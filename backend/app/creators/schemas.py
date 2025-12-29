from pydantic import BaseModel, HttpUrl, Field, field_validator
from typing import Optional
from datetime import datetime
import re
from app.creators.models import CreatorApplicationStatus


# ============ Creator Application Schemas ============

class CreatorApplicationCreate(BaseModel):
    """Схема для створення заявки креатора"""
    portfolio_url: Optional[str] = Field(None, max_length=500, description="Посилання на портфоліо (Behance, ArtStation, etc.)")
    motivation: Optional[str] = Field(None, max_length=2000, description="Мотиваційний лист (чому хочете стати креатором)")


class CreatorApplicationResponse(BaseModel):
    """Схема відповіді заявки креатора"""
    id: int
    user_id: int
    portfolio_url: Optional[str]
    motivation: Optional[str]
    status: CreatorApplicationStatus
    rejection_reason: Optional[str]
    created_at: datetime
    reviewed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ Creator Status Schemas ============

class CreatorStatusResponse(BaseModel):
    """Статус користувача як креатора"""
    is_creator: bool
    has_pending_application: bool
    application: Optional[CreatorApplicationResponse] = None
    creator_balance: int = 0


# ============ Creator Balance Schemas ============

class CreatorBalanceResponse(BaseModel):
    """Баланс креатора"""
    balance_coins: int
    balance_usd: float
    total_sales: int = 0  # Всього продажів
    total_earned_coins: int = 0  # Всього заробив
    pending_coins: int = 0  # В очікуванні (товари на модерації)


# ============ Payout Schemas ============

class PayoutRequest(BaseModel):
    """Запит на виплату"""
    amount_coins: int = Field(..., gt=0, description="Кількість coins для виплати")
    usdt_address: str = Field(..., min_length=20, max_length=100, description="USDT адреса")
    usdt_network: str = Field(..., description="Мережа (TRC20, ERC20, BEP20)")

    @field_validator('usdt_address')
    @classmethod
    def validate_usdt_address(cls, v: str, info) -> str:
        """Валідація USDT адреси в залежності від мережі"""
        # Отримуємо мережу з даних (якщо вже встановлена)
        data = info.data if hasattr(info, 'data') else {}
        network = data.get('usdt_network', '').upper()

        if network == 'TRC20':
            # Tron адреса: T + 33 символи base58
            if not re.match(r'^T[A-Za-z1-9]{33}$', v):
                raise ValueError('Invalid TRC20 address format (must start with T and be 34 characters)')
        elif network in ['ERC20', 'BEP20']:
            # Ethereum/BSC адреса: 0x + 40 hex символів
            if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
                raise ValueError(f'Invalid {network} address format (must be 0x followed by 40 hex characters)')
        elif network:
            # Якщо мережа вказана, але не підтримується
            if network not in ['TRC20', 'ERC20', 'BEP20']:
                raise ValueError(f'Unsupported network: {network}. Must be TRC20, ERC20, or BEP20')

        return v


class PayoutResponse(BaseModel):
    """Відповідь запиту виплати"""
    id: int
    amount_coins: int
    amount_usd: int  # В центах
    usdt_address: str
    usdt_network: str
    status: str
    transaction_hash: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ Transaction Schemas ============

class CreatorTransactionResponse(BaseModel):
    """Історія транзакції креатора"""
    id: int
    transaction_type: str
    amount_coins: int
    description: Optional[str]
    created_at: datetime
    product_id: Optional[int]
    order_id: Optional[int]

    class Config:
        from_attributes = True


# ============ Creator Product Schemas ============

class CreatorProductCreate(BaseModel):
    """Схема створення товару креатором"""
    title_uk: str = Field(..., min_length=1, max_length=200)
    description_uk: str = Field(..., min_length=10)
    price: float = Field(..., ge=2.0, description="Ціна в USD (мінімум $2)")
    category_ids: list[int] = Field(default=[], description="ID категорій")
    main_image_url: str = Field(..., max_length=500)
    gallery_image_urls: list[str] = Field(default=[], max_items=5)
    zip_file_path: str = Field(..., max_length=500)
    file_size_mb: float = Field(..., ge=0, le=10, description="Розмір файлу (макс 10 MB)")
    compatibility: Optional[str] = Field(None, max_length=200, description="Сумісність з Revit")
    product_type: str = Field(default="premium", description="Тип товару (завжди premium для креаторів)")


class CreatorProductUpdate(BaseModel):
    """Схема оновлення товару креатором"""
    title_uk: Optional[str] = Field(None, min_length=1, max_length=200)
    description_uk: Optional[str] = Field(None, min_length=10)
    price: Optional[float] = Field(None, ge=2.0)
    category_ids: Optional[list[int]] = None
    main_image_url: Optional[str] = Field(None, max_length=500)
    gallery_image_urls: Optional[list[str]] = Field(None, max_items=5)
    zip_file_path: Optional[str] = Field(None, max_length=500)
    file_size_mb: Optional[float] = Field(None, ge=0, le=10)
    compatibility: Optional[str] = Field(None, max_length=200)


class CreatorProductResponse(BaseModel):
    """Відповідь товару креатора"""
    id: int
    title: str
    description: str
    price: float
    author_id: int
    moderation_status: str
    rejection_reason: Optional[str]
    main_image_url: str
    gallery_image_urls: list[str]
    zip_file_path: str
    file_size_mb: float
    compatibility: Optional[str]
    views_count: int
    downloads_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    category_ids: list[int] = []

    class Config:
        from_attributes = True


class TopProductItem(BaseModel):
    """Топ товар"""
    id: int
    title: str
    views: Optional[int] = 0
    downloads: Optional[int] = 0

class CreatorProductStats(BaseModel):
    """Статистика товару креатора"""
    total_products: int = 0
    draft_products: int = 0
    pending_products: int = 0
    approved_products: int = 0
    rejected_products: int = 0
    total_sales: int = 0
    total_revenue_coins: int = 0
    total_views: int = 0
    total_downloads: int = 0
    top_products_by_views: list[TopProductItem] = []
    top_products_by_downloads: list[TopProductItem] = []
