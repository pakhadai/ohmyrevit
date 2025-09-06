# backend/app/referrals/models.py
"""
Моделі для реферальної системи
"""
from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Enum as SQLAlchemyEnum, Numeric
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base
from app.users.models import User
from app.orders.models import Order


class ReferralBonusType(str, enum.Enum):
    REGISTRATION = "registration"
    PURCHASE = "purchase"


class ReferralLog(Base):
    __tablename__ = "referral_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Хто отримав бонус
    referrer_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # За кого отримав бонус
    referred_user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Якщо бонус за покупку, посилання на замовлення
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=True)

    bonus_type = Column(SQLAlchemyEnum(ReferralBonusType, name="referralbonustype"), nullable=False)
    bonus_amount = Column(Integer, nullable=False)

    # Для відсотка від покупки
    purchase_amount = Column(Numeric(10, 2), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Зв'язки
    referrer = relationship("User", foreign_keys=[referrer_id], backref="referral_logs")
    referred_user = relationship("User", foreign_keys=[referred_user_id])
    order = relationship("Order")

    def __repr__(self):
        return f"<ReferralLog(id={self.id}, referrer_id={self.referrer_id}, amount={self.bonus_amount})>"