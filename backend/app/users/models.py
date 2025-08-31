# backend/app/users/models.py
"""
SQLAlchemy модель для користувачів
"""
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean,
    Date, DateTime, func
)
from app.core.database import Base


class User(Base):
    """
    Модель користувача для Telegram Mini App
    """
    __tablename__ = "users"

    # Основні поля
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    language_code = Column(String(10), default="uk")
    # ДОДАНО: Поле для зберігання URL фотографії
    photo_url = Column(String(500), nullable=True)

    # Контактні дані
    email = Column(String(255), unique=True, nullable=True, index=True)
    phone = Column(String(20), nullable=True)

    # Права доступу
    is_admin = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Бонусна система
    bonus_balance = Column(Integer, default=0)
    bonus_streak = Column(Integer, default=0)
    last_bonus_claim_date = Column(Date, nullable=True)

    # Часові мітки
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, telegram_id={self.telegram_id}, username={self.username})>"
