"""
Моделі для підписок та доступів
"""
from sqlalchemy import (
    Column, Integer, ForeignKey, DateTime, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class AccessType(str, enum.Enum):
    PURCHASE = "purchase"
    SUBSCRIPTION = "subscription"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    end_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    payment_id = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Зв'язки
    user = relationship("User", backref="subscriptions")


class UserProductAccess(Base):
    __tablename__ = "user_product_access"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False)
    access_type = Column(Enum(AccessType), nullable=False)
    granted_at = Column(DateTime(timezone=True), server_default=func.now())

    # Зв'язки
    user = relationship("User", backref="product_access")
    product = relationship("Product")

    # Унікальність
    __table_args__ = (
        UniqueConstraint('user_id', 'product_id', name='uq_user_product'),
    )