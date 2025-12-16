from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime


class UserBase(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    language_code: str = "uk"
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    language_code: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None


class UserInDB(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    balance: int  # CHANGED: bonus_balance -> balance (OMR Coins)
    bonus_streak: int
    last_bonus_claim_date: Optional[date] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    language_code: str
    email: Optional[EmailStr] = None
    photo_url: Optional[str] = None
    is_admin: bool
    balance: int  # CHANGED: bonus_balance -> balance (OMR Coins)
    bonus_streak: int
    created_at: datetime
    referral_code: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TelegramAuthData(BaseModel):
    id: Optional[int] = Field(None, description="Telegram user ID")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None
    user: Optional[dict] = None
    query_id: Optional[str] = None
    start_param: Optional[str] = None
    language_code: Optional[str] = "uk"
    is_premium: Optional[bool] = False
    initData: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False


class BonusClaimResponse(BaseModel):
    success: bool
    bonus_amount: Optional[int] = None
    new_balance: Optional[int] = None
    new_streak: Optional[int] = None
    message: str