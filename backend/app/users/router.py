# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
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

# OLD: router = APIRouter()
auth_router = APIRouter() # ПЕРЕЙМЕНОВАНО: для ясності, що тут тільки авторизація


# OLD: @router.post("/auth/telegram", response_model=TokenResponse)
@auth_router.post("/auth/telegram", response_model=TokenResponse, tags=["Auth"])
async def telegram_auth(
        auth_data: TelegramAuthData,
        db: AsyncSession = Depends(get_db)
):

    user, is_new_user = await AuthService.authenticate_telegram_user(db, auth_data)

    # Створюємо токен
    access_token = AuthService.create_access_token(user.id)

    # Формуємо відповідь
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user
    )


# OLD: # Admin endpoints
# OLD: @router.get("/admin/users", response_model=list[UserResponse])
# OLD: async def get_all_users(
# OLD:         skip: int = 0,
# OLD:         limit: int = 100,
# OLD:         current_admin: User = Depends(get_current_admin_user),
# OLD:         db: AsyncSession = Depends(get_db)
# OLD: ):
# OLD: 
# OLD:     from sqlalchemy import select
# OLD: 
# OLD:     result = await db.execute(
# OLD:         select(User)
# OLD:         .offset(skip)
# OLD:         .limit(limit)
# OLD:         .order_by(User.created_at.desc())
# OLD:     )
# OLD:     users = result.scalars().all()
# OLD: 
# OLD:     return [UserResponse.model_validate(user) for user in users]
# OLD: 
# OLD: 
# OLD: @router.patch("/admin/users/{user_id}/toggle-admin")
# OLD: async def toggle_admin_status(
# OLD:         user_id: int,
# OLD:         current_admin: User = Depends(get_current_admin_user),
# OLD:         db: AsyncSession = Depends(get_db)
# OLD: ):
# OLD: 
# OLD:     from sqlalchemy import select
# OLD: 
# OLD:     result = await db.execute(
# OLD:         select(User).where(User.id == user_id)
# OLD:     )
# OLD:     user = result.scalar_one_or_none()
# OLD: 
# OLD:     if not user:
# OLD:         raise HTTPException(
# OLD:             status_code=status.HTTP_404_NOT_FOUND,
# OLD:             detail="Користувача не знайдено"
# OLD:         )
# OLD: 
# OLD:     # Не можна змінити статус самому собі
# OLD:     if user.id == current_admin.id:
# OLD:         raise HTTPException(
# OLD:             status_code=status.HTTP_400_BAD_REQUEST,
# OLD:             detail="Не можна змінити власний статус адміністратора"
# OLD:         )
# OLD: 
# OLD:     user.is_admin = not user.is_admin
# OLD:     await db.commit()
# OLD: 
# OLD:     return {
# OLD:         "success": True,
# OLD:         "user_id": user_id,
# OLD:         "is_admin": user.is_admin,
# OLD:         "message": f"Користувач {'отримав' if user.is_admin else 'втратив'} права адміністратора"
# OLD:     }
# ВИДАЛЕНО: Адмін-ендпоінти перенесено до app/admin/router.py для централізації