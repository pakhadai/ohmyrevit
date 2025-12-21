from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import EmailStr

from app.core.database import get_db
from app.users.models import User
from app.users.schemas import (
    TelegramAuthData, TokenResponse, UserResponse,
    UserRegister, UserLogin, ForgotPasswordRequest, UserChangePassword, UserUpdateProfile
)
from app.users.auth_service import AuthService
from app.users.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
        auth_data: TelegramAuthData,
        db: AsyncSession = Depends(get_db)
):
    """
    Вхід через Telegram.
    Створює користувача автоматично, якщо його немає.
    Повертає токен.
    """
    user, is_new = await AuthService.authenticate_hybrid_telegram_user(db, auth_data)

    access_token = AuthService.create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new,
        needs_registration=False  # Завжди False, бо вхід миттєвий
    )


@auth_router.post("/link-email")
async def link_email(
        email: EmailStr = Body(..., embed=True),
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Прив'язка Email до поточного акаунту (для користувачів Telegram).
    Відправляє лист підтвердження.
    """
    if user.is_email_verified and user.email == email:
        return {"message": "Email вже підтверджено"}

    await AuthService.initiate_email_linking(db, user, email)
    return {"message": "Лист підтвердження відправлено"}


@auth_router.post("/verify")
async def verify_email_token(
        token: str = Body(..., embed=True),
        db: AsyncSession = Depends(get_db)
):
    """
    Підтвердження Email (для реєстрації або прив'язки).
    Генерує пароль і відправляє його на пошту.
    """
    access_token, user, _ = await AuthService.verify_email_token(db, token)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=False
    )


@auth_router.post("/register")
async def register_site(
        data: UserRegister,
        db: AsyncSession = Depends(get_db)
):
    """Реєстрація через сайт (ввід email)"""
    await AuthService.register_by_email(db, data.email)
    return {"message": "Перевірте пошту"}


@auth_router.post("/login", response_model=TokenResponse)
async def login_site(
        data: UserLogin,
        db: AsyncSession = Depends(get_db)
):
    """Вхід через сайт (email + password)"""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not AuthService.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    access_token = AuthService.create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@auth_router.post("/forgot-password")
async def forgot_password(
        data: ForgotPasswordRequest,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.is_email_verified:
        # Генеруємо новий пароль і відправляємо
        # (логіка схожа на верифікацію, можна винести в сервіс)
        password = AuthService.generate_strong_password()
        user.hashed_password = AuthService.get_password_hash(password)
        await db.commit()

        # Тут треба використати email_service для відправки нового пароля
        # ...

    return {"message": "Якщо акаунт існує, ми відправили інструкції."}


@auth_router.post("/change-password")
async def change_password(
        data: UserChangePassword,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    if not user.hashed_password or not AuthService.verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Невірний старий пароль")

    user.hashed_password = AuthService.get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Пароль змінено"}


@auth_router.patch("/profile")
async def update_profile(
        data: UserUpdateProfile,
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    return UserResponse.model_validate(user)