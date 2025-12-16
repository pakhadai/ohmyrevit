from sqlalchemy import (
    Column, Integer, String, Numeric, Boolean,
    ForeignKey, DateTime, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PAID = "paid"  # Внутрішні замовлення проходять миттєво
    FAILED = "failed"  # Якщо транзакція не пройшла


class DiscountType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"  # В монетах


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(Enum(DiscountType), nullable=False)
    value = Column(Integer, nullable=False)  # Значення тепер в монетах (або %)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    orders_used_in = relationship("Order", back_populates="promo_code")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)

    # Всі суми тепер в цілих числах (Coins)
    subtotal = Column(Integer, nullable=False)
    discount_amount = Column(Integer, default=0)
    final_total = Column(Integer, nullable=False)

    status = Column(Enum(OrderStatus), default=OrderStatus.PAID)
    promo_code_id = Column(Integer, ForeignKey('promo_codes.id'), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    promo_code = relationship("PromoCode", back_populates="orders_used_in")

    @property
    def items_count(self) -> int:
        return len(self.items)


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    price_at_purchase = Column(Integer, nullable=False)  # Coins

    order = relationship("Order", back_populates="items")
    product = relationship("Product")