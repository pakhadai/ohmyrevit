from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Enum, Date
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from datetime import datetime


class OrderStatus(enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"


class DiscountType(enum.Enum):
    percentage = "percentage"
    fixed = "fixed"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    subtotal = Column(Numeric(10, 2))
    discount_amount = Column(Numeric(10, 2), default=0)
    final_total = Column(Numeric(10, 2))
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    payment_id = Column(String, nullable=True)  # ID від Cryptomus
    created_at = Column(DateTime, default=datetime.utcnow)

    # Зв'язки
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    price_at_purchase = Column(Numeric(10, 2))

    # Зв'язки
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True)
    discount_type = Column(Enum(DiscountType))
    value = Column(Numeric(10, 2))
    expires_at = Column(DateTime, nullable=True)
    max_uses = Column(Integer, nullable=True)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)