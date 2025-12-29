from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApplicationReviewRequest(BaseModel):
    """Адмін рішення по заявці"""
    action: str = Field(..., description="approve або reject")
    rejection_reason: Optional[str] = Field(None, max_length=500)


class ProductModerationRequest(BaseModel):
    """Модерація товару креатора"""
    action: str = Field(..., description="approve, reject або hide")
    rejection_reason: Optional[str] = Field(None, max_length=500)


class PayoutApprovalRequest(BaseModel):
    """Підтвердження виплати"""
    transaction_hash: str = Field(..., min_length=10, max_length=100)


class CreatorListResponse(BaseModel):
    """Список креаторів для адміна"""
    id: int
    email: Optional[str]
    telegram_id: Optional[int]
    first_name: str
    is_creator: bool
    creator_balance: int
    total_products: int = 0
    total_sales: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PendingApplicationResponse(BaseModel):
    """Заявка на розгляді"""
    id: int
    user_id: int
    user_email: Optional[str]
    user_name: str
    portfolio_url: Optional[str]
    motivation: Optional[str]
    applied_at: datetime

    class Config:
        from_attributes = True


class PendingProductResponse(BaseModel):
    """Товар на модерації"""
    id: int
    title: str
    description: Optional[str]
    price_coins: int
    author_id: int
    author_name: str
    file_url: Optional[str]
    images: list
    created_at: datetime

    class Config:
        from_attributes = True


class PendingPayoutResponse(BaseModel):
    """Виплата на розгляді"""
    id: int
    creator_id: int
    creator_email: Optional[str]
    creator_name: str
    amount_coins: int
    amount_usd: int
    usdt_address: str
    usdt_network: str
    requested_at: datetime

    class Config:
        from_attributes = True
