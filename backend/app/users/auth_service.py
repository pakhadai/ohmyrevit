# backend/app/users/auth_service.py
"""
Сервіс для авторизації користувачів через Telegram
"""
import hashlib
import hmac
import time
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import logging

from app.core.config import settings
from app.users.models import User
from app.users.schemas import TelegramAuthData

logger = logging.getLogger(__name__)


class AuthService:
    """
    Сервіс для роботи з авторизацією
    """

    @staticmethod
    def verify_telegram_auth(auth_data: dict) -> bool:
        """
        Перевірка підпису даних від Telegram

        Args:
            auth_data: Словник з даними від Telegram

        Returns:
            True якщо дані валідні
        """
        # В режимі розробки пропускаємо перевірку
        if settings.DEBUG:
            logger.info("🔧 Debug mode: skipping Telegram auth verification")
            return True

        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("⚠️ TELEGRAM_BOT_TOKEN not configured!")
            return settings.DEBUG

        auth_dict = auth_data.copy()
        received_hash = auth_dict.pop('hash', '')

        # Логуємо отримані дані
        logger.info(
            f"📥 Received auth data: {json.dumps({k: v for k, v in auth_dict.items() if k != 'hash'}, default=str)}")

        # Для тестування
        if not received_hash or received_hash == 'test_hash_for_development':
            return settings.DEBUG

        # Перевірка часу
        auth_date = auth_dict.get('auth_date', 0)
        if time.time() - int(auth_date) > 86400:  # 24 години
            logger.warning("⏰ Auth data is too old")
            return False

        # Формуємо рядок для перевірки
        check_string_parts = []
        for key in sorted(auth_dict.keys()):
            value = auth_dict[key]
            if value is not None:
                if isinstance(value, (dict, list)):
                    value = json.dumps(value, separators=(',', ':'))
                check_string_parts.append(f"{key}={value}")

        check_string = "\n".join(check_string_parts)
        logger.debug(f"Check string: {check_string}")

        # Обчислюємо хеш
        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        is_valid = computed_hash == received_hash
        logger.info(f"✅ Auth validation result: {is_valid}")

        return is_valid

    @staticmethod
    def create_access_token(user_id: int) -> str:
        """
        Створення JWT токену

        Args:
            user_id: ID користувача

        Returns:
            JWT токен
        """
        expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        payload = {
            "sub": str(user_id),
            "exp": expire,
            "iat": datetime.utcnow()
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        logger.info(f"🔑 Created token for user {user_id}")
        return token

    @staticmethod
    def verify_token(token: str) -> Optional[int]:
        """
        Перевірка JWT токену

        Args:
            token: JWT токен

        Returns:
            ID користувача або None
        """
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            user_id = int(payload.get("sub"))
            return user_id
        except (JWTError, ValueError) as e:
            logger.error(f"❌ Token verification failed: {e}")
            return None

    @staticmethod
    async def authenticate_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> User:
        """
        Автентифікація користувача через Telegram.
        Створює нового користувача або оновлює існуючого.

        Args:
            db: Сесія бази даних
            auth_data: Дані від Telegram

        Returns:
            Об'єкт користувача
        """
        logger.info(f"🔄 Starting authentication for Telegram user {auth_data.id}")

        # Конвертуємо в словник для перевірки
        auth_data_dict = auth_data.model_dump(exclude_none=True)

        # Перевіряємо підпис (в продакшні)
        if not settings.DEBUG:
            if not AuthService.verify_telegram_auth(auth_data_dict):
                logger.error("❌ Invalid Telegram authentication data")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Telegram authentication data"
                )

        # Шукаємо користувача в БД
        result = await db.execute(
            select(User).where(User.telegram_id == auth_data.id)
        )
        user = result.scalar_one_or_none()

        # Готуємо дані для створення/оновлення
        user_data = {
            'username': auth_data.username,
            'first_name': auth_data.first_name or f'User {auth_data.id}',
            'last_name': auth_data.last_name,
            'language_code': auth_data.language_code or 'uk',
            'photo_url': auth_data.photo_url,
            'last_login_at': datetime.utcnow()
        }

        if user:
            # Оновлюємо існуючого користувача
            logger.info(f"📝 Updating existing user {user.id}")
            for key, value in user_data.items():
                if value is not None:  # Оновлюємо тільки непусті значення
                    setattr(user, key, value)
        else:
            # Створюємо нового користувача
            logger.info(f"✨ Creating new user with telegram_id {auth_data.id}")

            user = User(
                telegram_id=auth_data.id,
                **user_data
            )

            # Перевіряємо чи це перший користувач (робимо адміном)
            first_user_check = await db.execute(select(User.id).limit(1))
            if not first_user_check.scalar_one_or_none():
                user.is_admin = True
                logger.info("👑 First user - setting as admin")

            db.add(user)

        # Зберігаємо зміни
        try:
            await db.commit()
            await db.refresh(user)
            logger.info(f"✅ User {user.id} authenticated successfully")
        except Exception as e:
            logger.error(f"❌ Database error: {e}")
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save user data"
            )

        return user