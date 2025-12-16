from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class CreateOrderRequest(BaseModel):
    """Запит на створення замовлення з оплатою монетами"""
    product_ids: List[int]
    promo_code: Optional[str] = None
    # Видалено use_bonus_points - тепер все оплачується монетами

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "product_ids": [1, 2, 3],
                "promo_code": "WINTER2025"
            }
        }
    )


class ApplyDiscountRequest(BaseModel):
    """Запит на розрахунок знижки"""
    product_ids: List[int]
    promo_code: Optional[str] = None


class ApplyDiscountResponse(BaseModel):
    """Відповідь з інформацією про знижку"""
    success: bool
    subtotal_coins: int  # Сума в монетах до знижки
    discount_coins: int = 0  # Знижка в монетах
    final_coins: int  # Фінальна сума в монетах
    user_balance: int  # Поточний баланс користувача
    has_enough_balance: bool  # Чи вистачає монет
    message: Optional[str] = None


class OrderResponse(BaseModel):
    """Базова відповідь замовлення"""
    id: int
    user_id: int
    subtotal_coins: int
    discount_coins: int
    final_coins: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    """Елемент замовлення"""
    id: int
    product_id: int
    price_coins: int  # Ціна в монетах

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    """Відповідь checkout - миттєва оплата монетами"""
    success: bool
    order_id: int
    coins_spent: int  # Списано монет
    new_balance: int  # Новий баланс
    message: str

    # Для сумісності з фронтендом (поки що)
    payment_url: Optional[str] = None  # Завжди None - оплата миттєва
    amount: Optional[Decimal] = None  # Deprecated


class InsufficientFundsResponse(BaseModel):
    """Відповідь при недостатньому балансі"""
    success: bool = False
    error: str = "insufficient_funds"
    required_coins: int  # Скільки потрібно
    current_balance: int  # Поточний баланс
    shortfall: int  # Скільки не вистачає
    message: str


# ============ Legacy schemas for compatibility ============

class LegacyCheckoutResponse(BaseModel):
    """Стара схема для сумісності"""
    order_id: int
    payment_url: Optional[str] = None
    amount: Decimal

    model_config = ConfigDict(from_attributes=True)