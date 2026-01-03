from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TransactionTypeEnum(str, Enum):
    DEPOSIT = "deposit"
    PURCHASE = "purchase"
    SUBSCRIPTION = "subscription"
    BONUS = "bonus"
    REFUND = "refund"
    REFERRAL = "referral"


# ============ CoinPack Schemas ============

class CoinPackBase(BaseModel):
    name: str
    price_usd: float
    coins_amount: int
    bonus_percent: int = 0
    stripe_price_id: str
    description: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    sort_order: int = 0


class CoinPackCreate(CoinPackBase):
    pass


class CoinPackUpdate(BaseModel):
    name: Optional[str] = None
    price_usd: Optional[float] = None
    coins_amount: Optional[int] = None
    bonus_percent: Optional[int] = None
    stripe_price_id: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class CoinPackResponse(CoinPackBase):
    id: int
    total_coins: int = Field(description="Загальна кількість монет з бонусом")
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ Transaction Schemas ============

class TransactionBase(BaseModel):
    type: TransactionTypeEnum
    amount: int
    description: Optional[str] = None


class TransactionResponse(TransactionBase):
    id: int
    balance_after: int
    order_id: Optional[int] = None
    subscription_id: Optional[int] = None
    external_id: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    page: int
    size: int


# ============ Wallet Schemas ============

class WalletBalanceResponse(BaseModel):
    balance: int
    balance_usd: float = Field(description="Еквівалент в доларах (balance / 100)")


class WalletInfoResponse(BaseModel):
    balance: int
    balance_usd: float
    coin_packs: List[CoinPackResponse]
    recent_transactions: List[TransactionResponse]


# ============ Stripe Schemas ============

class StripeCheckoutResponse(BaseModel):
    """Response for Stripe checkout session creation"""
    checkout_url: str
    session_id: str


class StripeWebhookResponse(BaseModel):
    """Response for Stripe webhook processing"""
    success: bool
    message: str
    user_id: Optional[int] = None
    coins_added: Optional[int] = None
    new_balance: Optional[int] = None