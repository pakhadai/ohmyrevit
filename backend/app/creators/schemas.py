from pydantic import BaseModel, HttpUrl, Field
from typing import Optional
from datetime import datetime
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

class CreatorProductStats(BaseModel):
    """Статистика товару креатора"""
    total_products: int = 0
    draft_products: int = 0
    pending_products: int = 0
    approved_products: int = 0
    rejected_products: int = 0
    total_sales: int = 0
    total_revenue_coins: int = 0
