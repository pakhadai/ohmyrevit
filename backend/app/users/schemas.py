from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, Dict, Any
from datetime import date, datetime


# 1. Створюємо базовий клас, який автоматично перетворює snake_case на camelCase
class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )


# 2. Успадковуємо UserBase від CamelModel, щоб усі нащадки теж мали цю властивість
class UserBase(CamelModel):
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


class UserUpdate(CamelModel):
    username: Optional[str] = None
    language_code: Optional[str] = None
    phone: Optional[str] = None


class UserUpdateProfile(CamelModel):
    first_name: Optional[str] = Field(None, min_length=1)
    last_name: Optional[str] = None
    birth_date: Optional[date] = None


class UserRegister(CamelModel):
    email: EmailStr


class UserLogin(CamelModel):
    email: EmailStr
    password: str


class UserChangePassword(CamelModel):
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

    # model_config вже успадкований від UserBase -> CamelModel


class UserResponse(CamelModel):
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

    # Тепер поле first_name полетить на фронт як firstName
    # referral_code -> referralCode і так далі.


class TelegramAuthData(CamelModel):
    id: Optional[int] = Field(None, description="Telegram user ID")
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    auth_date: Optional[int] = None
    hash: Optional[str] = None
    user: Optional[Dict[str, Any]] = None  # Виправив dict на Dict[str, Any] для кращої типізації
    query_id: Optional[str] = None
    start_param: Optional[str] = None
    language_code: Optional[str] = "uk"
    is_premium: Optional[bool] = False
    initData: Optional[str] = None # Це поле залишиться initData (camelCase), бо воно так і називається

    model_config = ConfigDict(extra="allow", alias_generator=to_camel, populate_by_name=True)


class TelegramLinkRequest(CamelModel):
    initData: str
    email: EmailStr
    password: Optional[str] = None


class ForgotPasswordRequest(CamelModel):
    email: EmailStr


class TokenResponse(CamelModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    is_new_user: bool = False
    needs_registration: bool = False


class BonusClaimResponse(CamelModel):
    success: bool
    bonus_amount: Optional[int] = None
    new_balance: Optional[int] = None
    new_streak: Optional[int] = None
    message: str
    next_claim_time: Optional[str] = None