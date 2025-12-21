from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Dict, Any
from datetime import date, datetime


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: str
    last_name: Optional[str] = None
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    language_code: str = "uk"
    phone: Optional[str] = None
    birth_date: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: Optional[str] = None
    language_code: Optional[str] = None
    phone: Optional[str] = None


class UserUpdateProfile(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1)
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    email: Optional[EmailStr] = None


class UserRegister(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    id: int
    is_admin: bool
    is_email_verified: bool
    balance: int
    bonus_streak: int
    created_at: datetime
    referral_code: Optional[str] = None
    photo_url: Optional[str] = None


class TelegramAuthData(BaseModel):
    id: Optional[int] = Field(None, description="Telegram user ID")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None
    user: Optional[Dict[str, Any]] = None
    query_id: Optional[str] = None
    start_param: Optional[str] = None
    language_code: Optional[str] = "uk"
    is_premium: Optional[bool] = False
    initData: Optional[str] = None


class TelegramLinkRequest(BaseModel):
    initData: str
    email: EmailStr
    password: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False
    needs_registration: bool = False


class BonusClaimResponse(BaseModel):
    success: bool
    bonus_amount: Optional[int] = None
    new_balance: Optional[int] = None
    new_streak: Optional[int] = None
    message: str
    next_claim_time: Optional[str] = None