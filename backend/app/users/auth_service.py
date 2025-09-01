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
from app.users.schemas import TelegramAuthData


class AuthService:
    """
    Сервіс для роботи з авторизацією
    """

    @staticmethod
    def verify_telegram_auth(auth_data: dict) -> bool:
        """
        Перевірка підпису даних від Telegram

        ДЛЯ РОЗРОБКИ: Повертаємо True якщо немає токену або в режимі DEBUG
        """
        # В режимі розробки пропускаємо валідацію
        if settings.DEBUG or not settings.TELEGRAM_BOT_TOKEN:
            return True

        auth_dict = auth_data.copy()
        received_hash = auth_dict.pop('hash', '')

        # Якщо немає хешу - це тестовий режим
        if not received_hash or received_hash == 'test_hash' or received_hash == 'test_hash_for_development':
            return settings.DEBUG  # Дозволяємо тільки в DEBUG режимі

        # Перевірка часу (дані не старші 1 дня)
        auth_date = auth_dict.get('auth_date', 0)
        if time.time() - int(auth_date) > 86400:
            return False

        check_string_parts = []
        for key in sorted(auth_dict.keys()):
            if auth_dict[key] is not None:
                check_string_parts.append(f"{key}={auth_dict[key]}")

        check_string = "\n".join(check_string_parts)

        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        return computed_hash == received_hash

    @staticmethod
    def create_access_token(user_id: int) -> str:
        """
        Створення JWT токену
        """
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow()
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def verify_token(token: str) -> Optional[int]:
        """
        Перевірка JWT токену
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
        """
        # Перевіряємо підпис (в DEBUG режимі завжди пропускає)
        auth_data_dict = auth_data.model_dump()
        if not AuthService.verify_telegram_auth(auth_data_dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Telegram authentication data"
            )

        # Шукаємо користувача
        result = await db.execute(
            select(User).where(User.telegram_id == auth_data.id)
        )
        user = result.scalar_one_or_none()

        # Готуємо дані для оновлення/створення
        update_fields = {
            'username': auth_data.username or f'user_{auth_data.id}',
            'first_name': auth_data.first_name or 'User',
            'last_name': auth_data.last_name,
            'language_code': auth_data.language_code or 'uk',
            'photo_url': auth_data.photo_url,
            'last_login_at': datetime.utcnow()
        }

        if user:
            # Оновлюємо існуючого користувача
            for key, value in update_fields.items():
                if value is not None:
                    setattr(user, key, value)
        else:
            # Створюємо нового користувача
            user = User(
                telegram_id=auth_data.id,
                **update_fields
            )
            # Для першого користувача робимо адміном
            first_user = await db.execute(select(User).limit(1))
            if not first_user.scalar_one_or_none():
                user.is_admin = True

            db.add(user)

        await db.commit()
        await db.refresh(user)
        return user