from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.users.models import User
from app.users.auth_service import AuthService
from app.core.translations import get_text

security = HTTPBearer(auto_error=False)


async def get_current_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        token_from_query: Optional[str] = Query(None, alias="token"),
        db: AsyncSession = Depends(get_db)
) -> User:

    token = None
    if credentials:
        token = credentials.credentials
    elif token_from_query:
        token = token_from_query

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=get_text("auth_error_not_authenticated", "uk"),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = AuthService.verify_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=get_text("auth_error_invalid_token", "uk"),
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("auth_error_user_not_found", "uk")
        )

    if not user.is_active:
        lang = user.language_code or "uk"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_text("auth_error_account_disabled", lang)
        )

    return user


async def get_current_admin_user(
        current_user: User = Depends(get_current_user)
) -> User:

    if not current_user.is_admin:
        lang = current_user.language_code or "uk"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=get_text("auth_error_not_enough_permissions", lang)
        )
    return current_user