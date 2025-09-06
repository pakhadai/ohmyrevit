# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
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
    bonus_balance: int
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

class PromoCodeDetailResponse(PromoCodeResponse):
    """Детальна відповідь для промокоду з історією замовлень"""
    orders_used_in: List[OrderForPromoCode] = []


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

# ДОДАНО: Схеми для детального профілю користувача
class SubscriptionForUser(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    status: str

class OrderForUser(BaseModel):
    id: int
    final_total: float
    status: str
    created_at: datetime
    items_count: int

class ReferralForUser(BaseModel):
    id: int
    first_name: str
    last_name: Optional[str]
    username: Optional[str]
    created_at: datetime

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

    model_config = ConfigDict(from_attributes=True)

# ДОДАНО: Схеми для детального замовлення
class ProductInOrder(BaseModel):
    id: int
    title: str
    price_at_purchase: float
    main_image_url: str

class OrderDetailResponse(BaseModel):
    id: int
    user: UserBrief
    subtotal: float
    discount_amount: float
    bonus_used: int
    final_total: float
    status: str
    promo_code: Optional[PromoCodeResponse] = None
    payment_url: Optional[str] = None
    payment_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
    items: List[ProductInOrder] = []

    model_config = ConfigDict(from_attributes=True)