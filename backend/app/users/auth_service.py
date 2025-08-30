# backend/app/users/auth_service.py
"""
Сервіс для авторизації користувачів через Telegram
"""
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import settings
from app.users.models import User
from app.users.schemas import TelegramAuthData, UserCreate


class AuthService:
    """
    Сервіс для роботи з авторизацією
    """

    @staticmethod
    def verify_telegram_auth(auth_data: TelegramAuthData) -> bool:
        """
        Перевірка підпису даних від Telegram

        Args:
            auth_data: Дані авторизації від Telegram

        Returns:
            bool: True якщо дані валідні
        """
        # Перевірка часу (дані не старші 1 дня)
        if time.time() - auth_data.auth_date > 86400:
            return False

        # Формуємо рядок для перевірки
        check_string_parts = []

        # Збираємо всі поля крім hash
        auth_dict = auth_data.model_dump()
        received_hash = auth_dict.pop('hash')

        # Сортуємо ключі та формуємо рядок
        for key in sorted(auth_dict.keys()):
            if auth_dict[key] is not None:
                check_string_parts.append(f"{key}={auth_dict[key]}")

        check_string = "\n".join(check_string_parts)

        # Створюємо секретний ключ
        secret_key = hashlib.sha256(
            settings.TELEGRAM_BOT_TOKEN.encode()
        ).digest()

        # Обчислюємо хеш
        computed_hash = hmac.new(
            secret_key,
            check_string.encode(),
            hashlib.sha256
        ).hexdigest()

        return computed_hash == received_hash

    @staticmethod
    def create_access_token(user_id: int) -> str:
        """
        Створення JWT токену

        Args:
            user_id: ID користувача

        Returns:
            str: JWT токен
        """
        expire = datetime.utcnow() + timedelta(
            hours=settings.JWT_EXPIRATION_HOURS
        )

        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow()
        }

        return jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )

    @staticmethod
    def verify_token(token: str) -> Optional[int]:
        """
        Перевірка JWT токену

        Args:
            token: JWT токен

        Returns:
            Optional[int]: ID користувача або None
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = int(payload.get("sub"))
            return user_id
        except (JWTError, ValueError):
            return None

    @staticmethod
    async def authenticate_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> User:
        """
        Автентифікація користувача через Telegram

        Args:
            db: Сесія бази даних
            auth_data: Дані від Telegram

        Returns:
            User: Об'єкт користувача

        Raises:
            HTTPException: Якщо дані не валідні
        """
        # Перевіряємо підпис
        if not AuthService.verify_telegram_auth(auth_data):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Telegram authentication data"
            )

        # Шукаємо користувача в БД
        result = await db.execute(
            select(User).where(User.telegram_id == auth_data.id)
        )
        user = result.scalar_one_or_none()

        # Якщо користувач існує - оновлюємо дані
        if user:
            user.last_login_at = datetime.utcnow()

            # Оновлюємо дані якщо вони змінились
            if auth_data.username and user.username != auth_data.username:
                user.username = auth_data.username
            if auth_data.first_name and user.first_name != auth_data.first_name:
                user.first_name = auth_data.first_name
            if auth_data.last_name and user.last_name != auth_data.last_name:
                user.last_name = auth_data.last_name
            if auth_data.language_code and user.language_code != auth_data.language_code:
                user.language_code = auth_data.language_code

            await db.commit()
            await db.refresh(user)
        else:
            # Створюємо нового користувача
            user = User(
                telegram_id=auth_data.id,
                username=auth_data.username,
                first_name=auth_data.first_name,
                last_name=auth_data.last_name,
                language_code=auth_data.language_code or "uk",
                last_login_at=datetime.utcnow()
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        return user