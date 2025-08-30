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
    user = await AuthService.authenticate_telegram_user(db, auth_data)

    # Створюємо токен
    access_token = AuthService.create_access_token(user.id)

    # Формуємо відповідь
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/profile/me", response_model=UserResponse)
async def get_current_user_profile(
        current_user: User = Depends(get_current_user)
):
    """
    Отримання профілю поточного користувача

    Потребує валідний JWT токен в заголовку Authorization.
    """
    return UserResponse.model_validate(current_user)


@router.patch("/profile/me", response_model=UserResponse)
async def update_current_user_profile(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Оновлення профілю поточного користувача

    Дозволяє оновити email, телефон та інші дані профілю.
    """
    # Оновлюємо тільки передані поля
    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    # Оновлюємо час модифікації
    current_user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/profile/claim-bonus", response_model=BonusClaimResponse)
async def claim_daily_bonus(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання щоденного бонусу

    Користувач може отримати бонус раз на день.
    Стрік збільшується при щоденному вході.
    """
    today = date.today()

    # Перевіряємо чи вже отримував бонус сьогодні
    if current_user.last_bonus_claim_date == today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Бонус вже отримано сьогодні"
        )

    # Розраховуємо стрік
    if current_user.last_bonus_claim_date:
        days_diff = (today - current_user.last_bonus_claim_date).days

        if days_diff == 1:
            # Продовжуємо стрік
            current_user.bonus_streak += 1
        elif days_diff > 1:
            # Стрік перервано
            current_user.bonus_streak = 1
    else:
        # Перший бонус
        current_user.bonus_streak = 1

    # Розраховуємо суму бонусу (базовий + бонус за стрік)
    bonus_amount = settings.DAILY_BONUS_AMOUNT
    if current_user.bonus_streak > 7:
        bonus_amount += 5  # +5 бонусів за тиждень стріку
    if current_user.bonus_streak > 30:
        bonus_amount += 10  # +10 бонусів за місяць стріку

    # Нараховуємо бонуси
    current_user.bonus_balance += bonus_amount
    current_user.last_bonus_claim_date = today

    await db.commit()
    await db.refresh(current_user)

    return BonusClaimResponse(
        success=True,
        bonus_amount=bonus_amount,
        new_balance=current_user.bonus_balance,
        new_streak=current_user.bonus_streak,
        message=f"Ви отримали {bonus_amount} бонусів! Стрік: {current_user.bonus_streak} днів"
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