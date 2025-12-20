from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import date, datetime


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: Optional[str] = None
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    language_code: str = "uk"
    phone: Optional[str] = None
    birth_date: Optional[date] = None


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


class UserRegister(BaseModel):
    email: EmailStr


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)


class UserInDB(UserBase):
    id: int
    is_admin: bool
    is_active: bool
    is_email_verified: bool
    balance: int
    bonus_streak: int
    last_bonus_claim_date: Optional[date] = None
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    telegram_id: Optional[int] = None
    username: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    birth_date: Optional[date] = None
    language_code: str
    photo_url: Optional[str] = None
    is_admin: bool
    is_email_verified: bool
    balance: int
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


class TelegramLinkRequest(BaseModel):
    initData: str
    email: EmailStr
    password: Optional[str] = None  # Потрібен, якщо email вже існує


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False
    needs_registration: bool = False