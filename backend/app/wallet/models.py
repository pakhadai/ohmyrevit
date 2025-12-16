from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, Text, func, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TransactionType(str, enum.Enum):
    DEPOSIT = "deposit"  # Поповнення через Gumroad
    PURCHASE = "purchase"  # Покупка товару
    SUBSCRIPTION = "subscription"  # Оплата підписки
    BONUS = "bonus"  # Щоденний бонус
    REFUND = "refund"  # Повернення коштів
    REFERRAL = "referral"  # Бонус за реферала


class CoinPack(Base):
    """Пакети монет для покупки через Gumroad"""

    __tablename__ = "coin_packs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)

    # Ціна в доларах
    price_usd = Column(Float, nullable=False)

    # Кількість монет в пакеті
    coins_amount = Column(Integer, nullable=False)

    # Бонусний відсоток (наприклад, 10 = +10% монет)
    bonus_percent = Column(Integer, default=0)

    # Gumroad permalink (частина URL продукту)
    gumroad_permalink = Column(String(100), unique=True, nullable=False)

    # Чи активний пакет
    is_active = Column(Boolean, default=True)

    # Чи це популярний/рекомендований пакет
    is_featured = Column(Boolean, default=False)

    # Порядок відображення
    sort_order = Column(Integer, default=0)

    # Опис пакету
    description = Column(String(255), nullable=True)

    # Часові мітки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def get_total_coins(self) -> int:
        """Повертає загальну кількість монет з урахуванням бонусу"""
        bonus_coins = int(self.coins_amount * self.bonus_percent / 100)
        return self.coins_amount + bonus_coins

    def __repr__(self):
        return f"<CoinPack(id={self.id}, name={self.name}, coins={self.coins_amount})>"


class Transaction(Base):
    """Історія транзакцій користувача"""

    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    # Зв'язок з користувачем
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user = relationship("User", backref="transactions")

    # Тип транзакції
    type = Column(Enum(TransactionType), nullable=False, index=True)

    # Сума (позитивна для поповнення, негативна для витрат)
    amount = Column(Integer, nullable=False)

    # Баланс після транзакції
    balance_after = Column(Integer, nullable=False)

    # Опис транзакції
    description = Column(String(500), nullable=True)

    # Зв'язок з замовленням (якщо це покупка)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)

    # Зв'язок з підпискою (якщо це оплата підписки)
    subscription_id = Column(Integer, ForeignKey('user_subscriptions.id'), nullable=True)

    # Зовнішній ID (наприклад, Gumroad sale_id)
    external_id = Column(String(100), nullable=True, index=True)

    # Часова мітка
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Transaction(id={self.id}, user_id={self.user_id}, type={self.type}, amount={self.amount})>"