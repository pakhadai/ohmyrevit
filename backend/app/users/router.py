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

auth_router = APIRouter()

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
