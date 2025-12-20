import hashlib
import hmac
import time
import json
import secrets
import string
from urllib.parse import parse_qsl
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.core.config import settings
from app.users.models import User
from app.users.schemas import TelegramAuthData
from app.referrals.models import ReferralLog, ReferralBonusType
from app.core.telegram_service import telegram_service
from app.core.email import email_service
from app.core.translations import get_text

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def generate_strong_password(length: int = 12) -> str:
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(secrets.choice(alphabet) for _ in range(length))

    @staticmethod
    def generate_token_urlsafe() -> str:
        return secrets.token_urlsafe(32)

    @staticmethod
    def verify_telegram_auth(auth_data_obj: TelegramAuthData) -> Optional[dict]:
        if settings.ENVIRONMENT == 'development' and settings.DEBUG:
            if auth_data_obj.id and not auth_data_obj.initData:
                return auth_data_obj.model_dump()
            if not settings.TELEGRAM_BOT_TOKEN:
                return {"user": {"id": 12345, "first_name": "DevUser"}}

        if not auth_data_obj.initData:
            return None

        try:
            parsed_data = dict(parse_qsl(auth_data_obj.initData))
        except ValueError:
            return None

        received_hash = parsed_data.pop('hash', '')
        if not received_hash:
            return None

        auth_date = int(parsed_data.get('auth_date', 0))
        if time.time() - auth_date > 86400:
            return None

        data_check_string = "\n".join(
            f"{key}={value}" for key, value in sorted(parsed_data.items())
        )

        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if computed_hash != received_hash:
            return None

        if 'user' in parsed_data:
            try:
                parsed_data['user'] = json.loads(parsed_data['user'])
            except json.JSONDecodeError:
                return None

        return parsed_data

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
        # (Логіка рефералів залишається без змін)
        start_param = start_param.strip()
        if user.referrer_id is not None or user.referral_code == start_param:
            return
        referrer_res = await db.execute(select(User).where(User.referral_code == start_param))
        referrer = referrer_res.scalar_one_or_none()
        if not referrer or referrer.id == user.id:
            return
        user.referrer_id = referrer.id
        bonus_amount = settings.REFERRAL_REGISTRATION_BONUS
        referrer.balance += bonus_amount
        log_entry = ReferralLog(
            referrer_id=referrer.id,
            referred_user_id=user.id,
            bonus_type=ReferralBonusType.REGISTRATION,
            bonus_amount=bonus_amount
        )
        db.add(log_entry)
        try:
            lang = referrer.language_code or "uk"
            message = get_text("auth_new_referral_msg", lang, user_name=user.first_name, bonus_amount=bonus_amount)
            await telegram_service.send_message(referrer.telegram_id, message)
        except Exception:
            pass

    @staticmethod
    async def register_by_email(db: AsyncSession, email: str) -> bool:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user and user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        verification_token = AuthService.generate_token_urlsafe()

        # Відправка Email
        link = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"
        html_content = f"""
        <h1>Вітаємо в OhMyRevit!</h1>
        <p>Для завершення реєстрації перейдіть за посиланням:</p>
        <a href="{link}">Підтвердити Email</a>
        <p>Якщо ви не реєструвалися, проігноруйте цей лист.</p>
        """

        await email_service.send_email(to=email, subject="Підтвердження реєстрації", html_content=html_content)

        # Зберігаємо токен (тимчасово в кеші або створюємо неактивного юзера)
        # Для спрощення створюємо/оновлюємо юзера з is_active=False (або is_email_verified=False)
        if not user:
            user = User(
                email=email,
                first_name="New User",
                verification_token=verification_token,
                is_email_verified=False,
                is_active=True  # Дозволяємо вхід тільки після верифікації
            )
            db.add(user)
        else:
            user.verification_token = verification_token

        await db.commit()
        return True

    @staticmethod
    async def verify_email_and_create(db: AsyncSession, token: str) -> Tuple[str, User, str]:
        result = await db.execute(select(User).where(User.verification_token == token))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid token")

        password = AuthService.generate_strong_password()
        user.hashed_password = AuthService.get_password_hash(password)
        user.is_email_verified = True
        user.verification_token = None

        # Генеруємо реферальний код
        if not user.referral_code:
            for _ in range(5):
                try:
                    user.referral_code = AuthService._generate_referral_code()
                    await db.flush()
                    break
                except IntegrityError:
                    await db.rollback()

        await db.commit()

        # Відправляємо пароль
        html_content = f"""
        <h1>Реєстрація успішна!</h1>
        <p>Ваш тимчасовий пароль: <strong>{password}</strong></p>
        <p>Будь ласка, змініть його в налаштуваннях профілю.</p>
        """
        await email_service.send_email(to=user.email, subject="Ваш пароль OhMyRevit", html_content=html_content)

        access_token = AuthService.create_access_token(user.id)
        return access_token, user, password

    @staticmethod
    async def authenticate_hybrid_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> Tuple[Optional[User], bool, bool]:
        """
        Повертає: (User object, is_new_user, needs_registration)
        """
        verified_data = AuthService.verify_telegram_auth(auth_data)

        if not verified_data:
            # Dev mode fallback logic ... (як в оригіналі)
            if settings.ENVIRONMENT == 'development' and auth_data.id:
                telegram_id = auth_data.id
            else:
                raise HTTPException(status_code=401, detail="Invalid Telegram data")
        else:
            user_info = verified_data.get('user') or verified_data
            telegram_id = user_info.get('id')

        result = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()

        if not user:
            # Юзера немає в базі - потрібна реєстрація через Email
            return None, False, True

        # Юзер є, оновлюємо дані
        user.last_login_at = datetime.now(timezone.utc)
        await db.commit()

        return user, False, False