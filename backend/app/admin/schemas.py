"""
Pydantic схеми для адмін-панелі
"""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal


class FileUploadResponse(BaseModel):
    """Відповідь після завантаження файлу"""
    file_path: str
    file_size_mb: float
    filename: str


class DashboardStats(BaseModel):
    """Статистика для дашборду"""
    users: Dict[str, int]
    products: Dict[str, int]
    subscriptions: Dict[str, int]
    orders: Dict[str, Any]
    revenue: Dict[str, float]
    # NEW: Статистика по монетах
    coins: Optional[Dict[str, Any]] = None


class UserBrief(BaseModel):
    """Скорочена інформація про користувача"""
    id: int
    telegram_id: int
    username: Optional[str]
    first_name: str
    last_name: Optional[str]
    email: Optional[str]
    is_admin: bool
    is_active: bool = True
    balance: int  # CHANGED: bonus_balance -> balance (OMR Coins)
    bonus_streak: int
    created_at: datetime
    photo_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Відповідь зі списком користувачів"""
    users: List[UserBrief]
    total: int
    skip: int
    limit: int


class CategoryResponse(BaseModel):
    """Відповідь для категорії"""
    id: int
    slug: str
    name: str

    model_config = ConfigDict(from_attributes=True)


# ============ Promo Code Schemas ============

class PromoCodeCreate(BaseModel):
    """Схема створення промокоду"""
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: str = Field(..., pattern="^(percentage|fixed)$")
    value: float = Field(..., gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None


class PromoCodeUpdate(BaseModel):
    """Схема оновлення промокоду"""
    code: Optional[str] = Field(None, min_length=3, max_length=50)
    discount_type: Optional[str] = Field(None, pattern="^(percentage|fixed)$")
    value: Optional[float] = Field(None, gt=0)
    max_uses: Optional[int] = Field(None, gt=0)
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class PromoCodeResponse(BaseModel):
    """Відповідь для промокоду"""
    id: int
    code: str
    discount_type: str
    value: float
    expires_at: Optional[datetime]
    max_uses: Optional[int]
    current_uses: int
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderForPromoCode(BaseModel):
    id: int
    final_total: float
    created_at: datetime
    user: UserBrief

    model_config = ConfigDict(from_attributes=True)


class PromoCodeDetailResponse(PromoCodeResponse):
    """Детальна відповідь для промокоду з історією замовлень"""
    orders_used_in: List[OrderForPromoCode] = []


# ============ Order Schemas ============

class OrderBrief(BaseModel):
    """Скорочена інформація про замовлення"""
    id: int
    user: Dict[str, Any]
    subtotal: float
    discount_amount: float
    final_total: float
    status: str
    items_count: int
    created_at: str


class OrderListResponse(BaseModel):
    """Відповідь зі списком замовлень"""
    orders: List[OrderBrief]
    total: int
    skip: int
    limit: int


class ProductInOrder(BaseModel):
    id: int
    title: str
    price_at_purchase: float
    main_image_url: str

    model_config = ConfigDict(from_attributes=True)


class OrderDetailResponse(BaseModel):
    id: int
    user: UserBrief
    subtotal: float
    discount_amount: float
    coins_spent: Optional[int] = None
    final_total: float
    status: str
    promo_code: Optional[PromoCodeResponse] = None
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    items: List[ProductInOrder] = []

    model_config = ConfigDict(from_attributes=True)


# ============ User Detail Schemas ============

class SubscriptionForUser(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    status: str
    is_auto_renewal: bool = True

    model_config = ConfigDict(from_attributes=True)


class OrderForUser(BaseModel):
    id: int
    final_total: float
    status: str
    created_at: datetime
    items_count: int

    model_config = ConfigDict(from_attributes=True)


class ReferralForUser(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str]
    username: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionForUser(BaseModel):
    """Транзакція для перегляду в профілі користувача"""
    id: int
    type: str
    amount: int
    balance_after: int
    description: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserDetailResponse(UserBrief):
    """Повна інформація про користувача для адмін-панелі"""
    phone: Optional[str]
    language_code: Optional[str]
    last_login_at: Optional[datetime]
    last_bonus_claim_date: Optional[date]

    # Пов'язані дані
    subscriptions: List[SubscriptionForUser] = []
    orders: List[OrderForUser] = []
    referrals: List[ReferralForUser] = []
    recent_transactions: List[TransactionForUser] = []  # NEW

    model_config = ConfigDict(from_attributes=True)


# ============ CoinPack Schemas (NEW) ============

class CoinPackCreate(BaseModel):
    """Схема створення пакету монет"""
    name: str = Field(..., min_length=2, max_length=100)
    price_usd: float = Field(..., gt=0)
    coins_amount: int = Field(..., gt=0)
    bonus_percent: int = Field(0, ge=0, le=100)
    gumroad_permalink: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0


class CoinPackUpdate(BaseModel):
    """Схема оновлення пакету монет"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    price_usd: Optional[float] = Field(None, gt=0)
    coins_amount: Optional[int] = Field(None, gt=0)
    bonus_percent: Optional[int] = Field(None, ge=0, le=100)
    gumroad_permalink: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class CoinPackResponse(BaseModel):
    """Відповідь для пакету монет"""
    id: int
    name: str
    price_usd: float
    coins_amount: int
    bonus_percent: int
    total_coins: int  # coins_amount + bonus
    gumroad_permalink: str
    gumroad_url: str  # Full URL
    description: Optional[str]
    is_active: bool
    is_featured: bool
    sort_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CoinPackListResponse(BaseModel):
    """Список пакетів монет"""
    packs: List[CoinPackResponse]
    total: int


# ============ Admin Actions Schemas ============

class AdminAddCoinsRequest(BaseModel):
    """Запит на ручне нарахування монет"""
    amount: int = Field(..., gt=0, description="Кількість монет")
    reason: str = Field(..., min_length=3, max_length=200, description="Причина")


class AdminAddCoinsResponse(BaseModel):
    """Відповідь після нарахування монет"""
    success: bool
    user_id: int
    coins_added: int
    new_balance: int
    transaction_id: int


class TriggerSchedulerResponse(BaseModel):
    """Відповідь після ручного запуску scheduler"""
    expired: int
    cancelled_pending: int
    renewals: Dict[str, int]
    timestamp: str