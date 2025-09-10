# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/users/router.py
"""
API роутер для користувачів та авторизації
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime

from app.core.database import get_db
from app.core.config import settings
from app.users.models import User
from app.users.schemas import (
    TelegramAuthData,
    TokenResponse,
    UserResponse,
    UserUpdate,
    BonusClaimResponse
)
from app.users.auth_service import AuthService
from app.users.dependencies import get_current_user, get_current_admin_user

router = APIRouter()


@router.post("/auth/telegram", response_model=TokenResponse)
async def telegram_auth(
        auth_data: TelegramAuthData,
        db: AsyncSession = Depends(get_db)
):
    """
    Авторизація через Telegram Mini App

    Приймає дані від Telegram, перевіряє їх підпис,
    створює або оновлює користувача та повертає JWT токен.
    """
    # Автентифікуємо користувача
    # OLD: user = await AuthService.authenticate_telegram_user(db, auth_data)
    user, is_new_user = await AuthService.authenticate_telegram_user(db, auth_data)

    # Створюємо токен
    access_token = AuthService.create_access_token(user.id)

    # Формуємо відповідь
    return TokenResponse(
        access_token=access_token,
        # OLD: user=UserResponse.model_validate(user)
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user
    )


# Admin endpoints
@router.get("/admin/users", response_model=list[UserResponse])
async def get_all_users(
        skip: int = 0,
        limit: int = 100,
        current_admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку всіх користувачів (тільки для адміна)
    """
    from sqlalchemy import select

    result = await db.execute(
        select(User)
        .offset(skip)
        .limit(limit)
        .order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    return [UserResponse.model_validate(user) for user in users]


@router.patch("/admin/users/{user_id}/toggle-admin")
async def toggle_admin_status(
        user_id: int,
        current_admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Зміна статусу адміністратора для користувача
    """
    from sqlalchemy import select

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Користувача не знайдено"
        )

    # Не можна змінити статус самому собі
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не можна змінити власний статус адміністратора"
        )

    user.is_admin = not user.is_admin
    await db.commit()

    return {
        "success": True,
        "user_id": user_id,
        "is_admin": user.is_admin,
        "message": f"Користувач {'отримав' if user.is_admin else 'втратив'} права адміністратора"
    }