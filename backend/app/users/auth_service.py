import hashlib
import hmac
import time
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging
import secrets
import string

from app.core.config import settings
from app.users.models import User
from app.users.schemas import TelegramAuthData
from app.referrals.models import ReferralLog, ReferralBonusType
from app.core.telegram_service import telegram_service

logger = logging.getLogger(__name__)


class AuthService:

    @staticmethod
    def verify_telegram_auth(auth_data: dict) -> bool:
        """
        Перевірка підпису даних від Telegram.
        """
        # 1. Локальна розробка (Development backdoor)
        # Дозволяємо вхід без валідного підпису ТІЛЬКИ якщо це development оточення.
        if settings.ENVIRONMENT == 'development' and settings.DEBUG:
            # logger.warning("⚠️ Auth verification SKIPPED (Development Mode)") # Розкоментуйте, якщо хочете бачити це в логах
            return True

        # 2. Перевірка налаштувань для Production
        if not settings.TELEGRAM_BOT_TOKEN:
            logger.error("⚠️ TELEGRAM_BOT_TOKEN not configured!")
            return False

        auth_dict = auth_data.copy()
        received_hash = auth_dict.pop('hash', '')

        if not received_hash:
            return False

        # 3. Перевірка актуальності даних (захист від Replay Attack)
        auth_date = auth_dict.get('auth_date', 0)
        try:
            # Дозволяємо дані не старіші за 1 годину (можна збільшити до 24 годин, якщо є проблеми з часом)
            if time.time() - int(auth_date) > 3600:
                logger.warning(f"⏰ Auth data is too old. Diff: {time.time() - int(auth_date)}")
                return False
        except (ValueError, TypeError):
            return False

        # 4. Формування рядка перевірки
        check_string_parts = []
        for key in sorted(auth_dict.keys()):
            value = auth_dict[key]
            if value is not None:
                if isinstance(value, (dict, list)):
                    pass
                check_string_parts.append(f"{key}={value}")

        check_string = "\n".join(check_string_parts)
        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        is_valid = hmac.compare_digest(computed_hash, received_hash)

        if not is_valid:
            logger.warning(f"❌ Invalid hash for user {auth_dict.get('id')}")

        return is_valid

    @staticmethod
    def create_access_token(user_id: int) -> str:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        payload = {"sub": str(user_id), "exp": expire, "iat": datetime.now(timezone.utc)}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return token

    @staticmethod
    def verify_token(token: str) -> Optional[int]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = int(payload.get("sub"))
            return user_id
        except (JWTError, ValueError):
            return None

    @staticmethod
    def _generate_referral_code(length: int = 8) -> str:
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    async def process_referral_link(db: AsyncSession, user: User, start_param: str):
        start_param = start_param.strip()

        if user.referrer_id is not None:
            return

        if user.referral_code == start_param:
            return

        referrer_res = await db.execute(select(User).where(User.referral_code == start_param))
        referrer = referrer_res.scalar_one_or_none()

        if not referrer or referrer.id == user.id:
            return

        user.referrer_id = referrer.id
        bonus_amount = settings.REFERRAL_REGISTRATION_BONUS
        referrer.bonus_balance += bonus_amount

        log_entry = ReferralLog(
            referrer_id=referrer.id,
            referred_user_id=user.id,
            bonus_type=ReferralBonusType.REGISTRATION,
            bonus_amount=bonus_amount
        )
        db.add(log_entry)

        try:
            message = (
                f"🎉 *Новий реферал!*\n\n"
                f"Користувач {user.first_name} зареєструвався за вашим посиланням.\n"
                f"Вам нараховано *+{bonus_amount}* бонусів! 💎"
            )
            await telegram_service.send_message(referrer.telegram_id, message)
        except Exception as e:
            logger.error(f"Failed to send referral notification: {e}")

    @staticmethod
    async def authenticate_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> Tuple[User, bool]:

        auth_data_dict = auth_data.model_dump(exclude_none=True)

        # Викликаємо нашу оновлену функцію перевірки
        if not AuthService.verify_telegram_auth(auth_data_dict):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram authentication data")

        result = await db.execute(select(User).where(User.telegram_id == auth_data.id))
        user = result.scalar_one_or_none()

        is_new_user = not user

        try:
            if is_new_user:
                user = User(
                    telegram_id=auth_data.id,
                    username=auth_data.username,
                    first_name=auth_data.first_name or f'User {auth_data.id}',
                    last_name=auth_data.last_name,
                    language_code=auth_data.language_code or 'uk',
                    photo_url=auth_data.photo_url,
                    last_login_at=datetime.now(timezone.utc)
                )
                db.add(user)
                await db.flush()

                for _ in range(5):
                    try:
                        user.referral_code = AuthService._generate_referral_code()
                        await db.flush()
                        break
                    except IntegrityError:
                        await db.rollback()
                        db.add(user)
                else:
                    raise HTTPException(status_code=500, detail="Could not generate unique referral code")

                users_count_res = await db.execute(select(func.count(User.id)))
                if users_count_res.scalar_one() == 1:
                    user.is_admin = True

            else:
                user.username = auth_data.username
                user.first_name = auth_data.first_name or user.first_name
                user.last_name = auth_data.last_name or user.last_name
                user.photo_url = auth_data.photo_url or user.photo_url
                user.last_login_at = datetime.now(timezone.utc)

                if not user.referral_code:
                    user.referral_code = AuthService._generate_referral_code()

            if auth_data.start_param:
                await AuthService.process_referral_link(db, user, auth_data.start_param)

            await db.commit()
            await db.refresh(user)
            return user, is_new_user

        except IntegrityError as e:
            await db.rollback()
            logger.error(f"Database integrity error: {e}")
            raise HTTPException(status_code=500, detail="Database error")
        except Exception as e:
            await db.rollback()
            logger.error(f"Auth error: {e}")
            raise HTTPException(status_code=500, detail="Authentication failed")