from sqlalchemy import Column, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class SubscriptionStatus(enum.Enum):
    active = "active"
    expired = "expired"
    cancelled = "cancelled"


class AccessType(enum.Enum):
    purchase = "purchase"
    subscription = "subscription"


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(Enum(SubscriptionStatus))
    payment_id = Column(String, nullable=True)

    user = relationship("User", back_populates="subscription")


class UserProductAccess(Base):
    __tablename__ = "user_product_access"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    access_type = Column(Enum(AccessType))
    granted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    product = relationship("Product")