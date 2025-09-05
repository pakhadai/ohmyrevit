# backend/app/users/dependencies.py
"""
Dependencies для авторизації
"""
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.users.models import User
from app.users.auth_service import AuthService

# Security схема для Swagger UI
security = HTTPBearer(auto_error=False)


async def get_current_user(
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), # Зробіть необов'язковим
        token_from_query: Optional[str] = Query(None, alias="token"), # Додайте отримання токена з query
        db: AsyncSession = Depends(get_db)
) -> User:
    """
    Отримання поточного користувача з токену (з заголовка або query-параметра)
    """
    token = None
    if credentials:
        token = credentials.credentials
    elif token_from_query:
        token = token_from_query

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = AuthService.verify_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Отримуємо користувача з БД
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    return user


async def get_current_admin_user(
        current_user: User = Depends(get_current_user)
) -> User:
    """
    Перевірка чи користувач є адміністратором

    Args:
        current_user: Поточний користувач

    Returns:
        User: Об'єкт користувача-адміна

    Raises:
        HTTPException: Якщо користувач не адмін
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user