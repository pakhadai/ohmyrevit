# backend/app/users/schemas.py
"""
Pydantic схеми для валідації даних користувачів
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime


class UserBase(BaseModel):
    """Базова схема користувача"""
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    language_code: str = "uk"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    """Схема для створення користувача"""
    pass


class UserUpdate(BaseModel):
    """Схема для оновлення користувача"""
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserInDB(UserBase):
    """Схема користувача з бази даних"""
    id: int
    is_admin: bool
    is_active: bool
    bonus_balance: int
    bonus_streak: int
    last_bonus_claim_date: Optional[date] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    """Схема відповіді для користувача"""
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    language_code: str
    email: Optional[EmailStr] = None
    # ДОДАНО: Поле для повернення URL фотографії на фронтенд
    photo_url: Optional[str] = None
    is_admin: bool
    bonus_balance: int
    bonus_streak: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TelegramAuthData(BaseModel):
    """Схема для даних авторизації з Telegram"""
    # ВИПРАВЛЕНО: Зроблено поля більш гнучкими, додано user та query_id
    id: int = Field(..., description="Telegram user ID")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: int
    hash: str
    user: Optional[dict] = None # Додано поле user, яке надсилає Telegram
    query_id: Optional[str] = None # Додано поле query_id

    # Додаткові поля для Mini App
    language_code: Optional[str] = "uk"
    is_premium: Optional[bool] = False

    class Config:
        # Дозволяємо додаткові поля, щоб уникнути помилок валідації
        extra = "allow"


class TokenResponse(BaseModel):
    """Схема відповіді з токеном"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class BonusClaimResponse(BaseModel):
    """Схема відповіді для отримання бонусу"""
    success: bool
    bonus_amount: int
    new_balance: int
    new_streak: int
    message: str