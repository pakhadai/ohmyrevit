from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from sqlalchemy import select
import json

from app.core.database import get_db
from app.users.models import User
from app.users.schemas import (
    TelegramAuthData, TokenResponse, UserResponse,
    UserRegister, UserLogin, TelegramLinkRequest,
    UserChangePassword, ForgotPasswordRequest, UserUpdateProfile
)
from app.users.auth_service import AuthService
from app.users.dependencies import get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Auth"])


@auth_router.post("/register")
async def register(
        data: UserRegister,
        db: AsyncSession = Depends(get_db)
):
    await AuthService.register_by_email(db, data.email)
    return {"message": "Перевірте вашу пошту для завершення реєстрації."}


@auth_router.post("/verify")
async def verify_email(
        token: str = Body(..., embed=True),
        db: AsyncSession = Depends(get_db)
):
    access_token, user, _ = await AuthService.verify_email_and_create(db, token)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=True
    )


@auth_router.post("/login", response_model=TokenResponse)
async def login(
        data: UserLogin,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not AuthService.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")

    access_token = AuthService.create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@auth_router.post("/telegram", response_model=TokenResponse)
async def telegram_auth_check(
        auth_data: TelegramAuthData,
        db: AsyncSession = Depends(get_db)
):
    # Тепер функція завжди повертає користувача (або створює його)
    user, is_new_user = await AuthService.authenticate_hybrid_telegram_user(db, auth_data)

    access_token = AuthService.create_access_token(user.id)

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user
    )


@auth_router.post("/telegram/link", response_model=TokenResponse)
async def link_telegram(
        data: TelegramLinkRequest,
        db: AsyncSession = Depends(get_db)
):
    tg_data = AuthService.verify_telegram_auth(TelegramAuthData(initData=data.initData))
    if not tg_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")

    tg_user = tg_data.get('user', {})
    telegram_id = tg_user.get('id')

    result = await db.execute(select(User).where(User.email == data.email))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if not data.password or not AuthService.verify_password(data.password, existing_user.hashed_password):
            raise HTTPException(status_code=401, detail="Для прив'язки існуючого акаунту потрібен вірний пароль")

        existing_user.telegram_id = telegram_id
        await db.commit()
        user = existing_user
    else:
        password = AuthService.generate_strong_password()
        user = User(
            email=data.email,
            telegram_id=telegram_id,
            first_name=tg_user.get('first_name', 'User'),
            last_name=tg_user.get('last_name'),
            username=tg_user.get('username'),
            photo_url=tg_user.get('photo_url'),
            language_code=tg_user.get('language_code', 'uk'),
            hashed_password=AuthService.get_password_hash(password),
            is_email_verified=True,
            is_active=True
        )
        db.add(user)
        await db.commit()

        for _ in range(5):
            try:
                user.referral_code = AuthService._generate_referral_code()
                await db.flush()
                break
            except IntegrityError:
                await db.rollback()
        await db.commit()

    access_token = AuthService.create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=not existing_user
    )


@auth_router.post("/forgot-password")
async def forgot_password(
        data: ForgotPasswordRequest,
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user:
        new_password = AuthService.generate_strong_password()
        user.hashed_password = AuthService.get_password_hash(new_password)
        await db.commit()

    return {"message": "Якщо email існує, ми відправили новий пароль."}


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