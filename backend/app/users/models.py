from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean,
    Date, DateTime, func, ForeignKey
)
from sqlalchemy.orm import relationship, Mapped
from typing import List
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    username = Column(String(100), nullable=True)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)

    birth_date = Column(Date, nullable=True)

    language_code = Column(String(10), default="uk")
    photo_url = Column(String(500), nullable=True)

    email = Column(String(255), unique=True, nullable=True, index=True)
    is_email_verified = Column(Boolean, default=False)
    verification_token = Column(String(255), nullable=True)

    hashed_password = Column(String(255), nullable=True)

    phone = Column(String(20), nullable=True)

    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, server_default='true')

    # Marketplace creator статус
    is_creator = Column(Boolean, default=False)  # Чи користувач є креатором
    creator_balance = Column(Integer, default=0)  # Баланс креатора (окремо від покупок)

    balance = Column(Integer, default=0)

    bonus_streak = Column(Integer, default=0)
    last_bonus_claim_date = Column(Date, nullable=True)

    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referrer_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    referrer = relationship("User", remote_side=[id], back_populates="referrals")
    referrals = relationship("User", back_populates="referrer", foreign_keys=[referrer_id])

    collections: Mapped[List["Collection"]] = relationship("Collection", back_populates="user",
                                                           cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, telegram_id={self.telegram_id})>"