# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/users/auth_service.py
"""
Сервіс для авторизації користувачів через Telegram
"""
import hashlib
import hmac
import time
import json
# OLD: from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
# # OLD: from typing import Optional, Dict, Any
from typing import Optional, Dict, Any, Tuple
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
# # OLD: from sqlalchemy import select, func
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
# ДОДАНО: Імпорт сервісу для відправки повідомлень
from app.core.telegram_service import telegram_service

logger = logging.getLogger(__name__)


class AuthService:
    """
    Сервіс для роботи з авторизацією
    """

    @staticmethod
    def verify_telegram_auth(auth_data: dict) -> bool:
        """
        Перевірка підпису даних від Telegram
        """
        if settings.DEBUG:
            logger.info("🔧 Debug mode: skipping Telegram auth verification")
            return True

        if not settings.TELEGRAM_BOT_TOKEN:
            logger.warning("⚠️ TELEGRAM_BOT_TOKEN not configured!")
            return settings.DEBUG

        auth_dict = auth_data.copy()
        received_hash = auth_dict.pop('hash', '')
        if not received_hash or received_hash == 'test_hash_for_development':
            return settings.DEBUG

        auth_date = auth_dict.get('auth_date', 0)
        if time.time() - int(auth_date) > 86400:  # 24 години
            logger.warning("⏰ Auth data is too old")
            return False

        check_string_parts = []
        for key in sorted(auth_dict.keys()):
            value = auth_dict[key]
            if value is not None:
                if isinstance(value, (dict, list)):
                    value = json.dumps(value, separators=(',', ':'), sort_keys=True)
                check_string_parts.append(f"{key}={value}")

        check_string = "\n".join(check_string_parts)
        secret_key = hashlib.sha256(settings.TELEGRAM_BOT_TOKEN.encode()).digest()
        computed_hash = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        is_valid = computed_hash == received_hash
        logger.info(f"✅ Auth validation result: {is_valid}")
        return is_valid

    @staticmethod
    def create_access_token(user_id: int) -> str:
        """
        Створення JWT токену
        """
# OLD:         expire = datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
# OLD:         payload = {"sub": str(user_id), "exp": expire, "iat": datetime.utcnow()}
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
        payload = {"sub": str(user_id), "exp": expire, "iat": datetime.now(timezone.utc)}
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        logger.info(f"🔑 Created token for user {user_id}")
        return token

    @staticmethod
    def verify_token(token: str) -> Optional[int]:
        """
        Перевірка JWT токену
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = int(payload.get("sub"))
            return user_id
        except (JWTError, ValueError) as e:
            logger.error(f"❌ Token verification failed: {e}")
            return None

    @staticmethod
    def _generate_referral_code(length: int = 8) -> str:
        """Генерує випадковий реферальний код."""
        alphabet = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    async def authenticate_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> Tuple[User, bool]:
        """
        Автентифікація користувача через Telegram з коректним управлінням транзакціями.
        """
        logger.info(f"🔄 Starting authentication for Telegram user {auth_data.id}")
        auth_data_dict = auth_data.model_dump(exclude_none=True)

        if not settings.DEBUG and not AuthService.verify_telegram_auth(auth_data_dict):
            logger.error("❌ Invalid Telegram authentication data")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Telegram authentication data")

        result = await db.execute(select(User).where(User.telegram_id == auth_data.id))
        user = result.scalar_one_or_none()

        is_new_user = not user

        try:
            # # OLD: async with db.begin():
            if is_new_user:
                logger.info(f"✨ Creating new user with telegram_id {auth_data.id}")
                user = User(
                    telegram_id=auth_data.id,
                    username=auth_data.username,
                    first_name=auth_data.first_name or f'User {auth_data.id}',
                    last_name=auth_data.last_name,
                    language_code=auth_data.language_code or 'uk',
                    photo_url=auth_data.photo_url,
# OLD:                     last_login_at=datetime.utcnow()
                    last_login_at=datetime.now(timezone.utc)
                )
                db.add(user)
                await db.flush() # Потрібно для отримання user.id

                for _ in range(5): # 5 спроб згенерувати унікальний код
                    try:
                        user.referral_code = AuthService._generate_referral_code()
                        await db.flush() # Спроба зберегти, щоб перевірити унікальність
                        break
                    except IntegrityError:
                        await db.rollback() # Відкат, якщо код не унікальний
                        db.add(user) # Додаємо користувача знову після відкату
                        logger.warning(f"Referral code collision for new user, retrying...")
                else: # Якщо всі 5 спроб невдалі
                    raise HTTPException(status_code=500, detail="Could not generate unique referral code")


                users_count_res = await db.execute(select(func.count(User.id)))
                if users_count_res.scalar_one() == 1: # Перший користувач системи
                    user.is_admin = True
                    logger.info("👑 First user - setting as admin")

                if auth_data.start_param:
                    referrer_code = auth_data.start_param.strip()
                    referrer_result = await db.execute(select(User).where(User.referral_code == referrer_code))
                    referrer = referrer_result.scalar_one_or_none()
                    if referrer and referrer.id != user.id:
                        user.referrer_id = referrer.id
                        referrer.bonus_balance += 30
                        db.add(ReferralLog(
                            referrer_id=referrer.id,
                            referred_user_id=user.id,
                            bonus_type=ReferralBonusType.REGISTRATION,
                            bonus_amount=30
                        ))
                        logger.info(f"🎁 User {referrer.id} will receive 30 bonuses for inviting user {user.id}")
                        # Надсилаємо сповіщення в Telegram
                        message = (
                            f"🎉 Вітаємо! За вашим посиланням зареєструвався новий користувач: *{user.first_name}*.\n"
                            f"Вам нараховано *+30* бонусів. 💎\n\n"
                            f"Дякуємо, що ви з нами!"
                        )
                        await telegram_service.send_message(referrer.telegram_id, message)


            else:  # Якщо користувач існує
                logger.info(f"📝 Updating existing user {user.id}")
                user.username = auth_data.username
                user.first_name = auth_data.first_name or f'User {auth_data.id}'
                user.last_name = auth_data.last_name
                user.language_code = auth_data.language_code or 'uk'
                user.photo_url = auth_data.photo_url
# OLD:                 user.last_login_at = datetime.utcnow()
                user.last_login_at = datetime.now(timezone.utc)

                if not user.referral_code:
                    for _ in range(5):
                        try:
                            user.referral_code = AuthService._generate_referral_code()
                            await db.flush()
                            logger.info(f"🔑 Generated missing referral code for existing user {user.id}")
                            break
                        except IntegrityError:
                            await db.rollback()
                            db.add(user)
                            logger.warning(f"Referral code collision for existing user {user.id}, retrying...")
                    else:
                        logger.error(f"Failed to generate referral code for user {user.id}")

            await db.flush()
            await db.refresh(user)
            logger.info(f"✅ User {user.id} authenticated successfully.")
            return user, is_new_user

        except IntegrityError as e:
             await db.rollback()
             logger.error(f"Database integrity error during auth for user {auth_data.id}: {e}", exc_info=True)
             raise HTTPException(status_code=500, detail="Database conflict occurred")
        except Exception as e:
            await db.rollback()
            logger.error(f"❌ Database error during auth: {e}", exc_info=True)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process user data")