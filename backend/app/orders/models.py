# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
"""
Моделі для замовлень та промокодів
"""
from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean,
    ForeignKey, DateTime, Enum, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"


class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(Enum(DiscountType), nullable=False)
    value = Column(Numeric(10, 2), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # OLD: orders_used_in = relationship("Order", back_populates="promo_code")
    orders_used_in = relationship("Order", back_populates="promo_code")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0)
    bonus_used = Column(Integer, default=0)
    final_total = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    promo_code_id = Column(Integer, ForeignKey('promo_codes.id'), nullable=True)
    payment_url = Column(String(500), nullable=True)
    payment_id = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)

    # Зв'язки
    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    # OLD: promo_code = relationship("PromoCode", back_populates="orders_used_in")
    promo_code = relationship("PromoCode", back_populates="orders_used_in")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    price_at_purchase = Column(Numeric(10, 2), nullable=False)

    # Зв'язки
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class WebhookProcessed(Base):
    __tablename__ = "webhook_processed"

    payment_id = Column(String(200), primary_key=True)
    processed_at = Column(DateTime(timezone=True), default=func.now())
    status = Column(String(50))
    success = Column(Boolean, default=True)