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
        """
        if settings.DEBUG or not settings.TELEGRAM_BOT_TOKEN:
            return True

        auth_dict = auth_data.copy()
        received_hash = auth_dict.pop('hash', '')

        if not received_hash or received_hash == 'test_hash_for_development':
            return settings.DEBUG

        auth_date = auth_dict.get('auth_date', 0)
        if time.time() - int(auth_date) > 86400: # 1 day
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
        Автентифікація користувача через Telegram.
        Створює нового користувача або ОНОВЛЮЄ існуючого актуальними даними з Telegram.
        """
        auth_data_dict = auth_data.model_dump()
        if not AuthService.verify_telegram_auth(auth_data_dict):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Telegram authentication data"
            )

        result = await db.execute(
            select(User).where(User.telegram_id == auth_data.id)
        )
        user = result.scalar_one_or_none()

        # Готуємо дані для оновлення/створення. Ці дані будуть оновлюватися при кожному вході.
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
            for key, value in user_data.items():
                setattr(user, key, value)
        else:
            # Створюємо нового користувача
            user = User(
                telegram_id=auth_data.id,
                **user_data
            )
            # Для першого користувача робимо адміном
            first_user_check = await db.execute(select(User.id).limit(1))
            if not first_user_check.scalar_one_or_none():
                user.is_admin = True
            db.add(user)

        await db.commit()
        await db.refresh(user)
        return user