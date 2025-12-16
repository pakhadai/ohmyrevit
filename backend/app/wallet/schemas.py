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
    gumroad_permalink: str
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
    gumroad_permalink: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class CoinPackResponse(CoinPackBase):
    id: int
    total_coins: int = Field(description="Загальна кількість монет з бонусом")
    gumroad_url: str = Field(description="Повне посилання на Gumroad")
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


# ============ Gumroad Webhook Schemas ============

class GumroadWebhookPayload(BaseModel):
    """
    Схема для Gumroad Ping webhook
    https://help.gumroad.com/article/200-ping
    """
    seller_id: str
    product_id: str
    product_name: str
    permalink: str
    product_permalink: str
    short_product_id: str
    sale_id: str
    sale_timestamp: str
    order_number: int
    url_params: Optional[dict] = None

    # Інформація про покупця
    email: str
    full_name: Optional[str] = None

    # Ціна
    price: int  # В центах
    currency: str = "usd"

    # Кастомні поля - тут буде user_id
    custom_fields: Optional[dict] = None

    # Статус
    refunded: bool = False
    disputed: bool = False
    dispute_won: bool = False

    # Підписка (якщо є)
    is_recurring_charge: bool = False
    recurrence: Optional[str] = None

    # Інше
    variants: Optional[dict] = None
    test: bool = False
    ip_country: Optional[str] = None

    model_config = ConfigDict(extra="allow")

    def get_user_id(self) -> Optional[int]:
        """Отримує user_id з custom_fields або url_params"""
        # Спочатку шукаємо в custom_fields
        if self.custom_fields:
            user_id = self.custom_fields.get("user_id")
            if user_id:
                return int(user_id)

        # Потім в url_params
        if self.url_params:
            user_id = self.url_params.get("user_id")
            if user_id:
                return int(user_id)

        return None


class GumroadWebhookResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[int] = None
    coins_added: Optional[int] = None
    new_balance: Optional[int] = None