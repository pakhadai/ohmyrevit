# backend/app/users/models.py
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean,
    Date, DateTime, func, ForeignKey
)
from sqlalchemy.orm import relationship, Mapped
from typing import List
from app.core.database import Base


class User(Base):

    __tablename__ = "users"

    # Основні поля
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    language_code = Column(String(10), default="uk")
    photo_url = Column(String(500), nullable=True)

    # Контактні дані
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)

    # Права доступу
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True, server_default='true')

    # Бонусна система
    bonus_balance = Column(Integer, default=0)
    bonus_streak = Column(Integer, default=0)
    last_bonus_claim_date = Column(Date, nullable=True)

    # Реферальна система
    referral_code = Column(String(20), unique=True, nullable=True, index=True)
    referrer_id = Column(Integer, ForeignKey('users.id'), nullable=True)

    referrer = relationship("User", remote_side=[id], back_populates="referrals")
    referrals = relationship("User", back_populates="referrer", foreign_keys=[referrer_id])


    # Зв'язок з колекціями
    collections: Mapped[List["Collection"]] = relationship("Collection", back_populates="user",
                                                           cascade="all, delete-orphan")

    # Часові мітки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, telegram_id={self.telegram_id}, username={self.username})>"