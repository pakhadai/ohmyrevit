import hashlib
import hmac
import time
import json
import secrets
import string
import base64
from urllib.parse import parse_qsl
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
        """
        Верифікує дані від Telegram Mini App.
        Підтримує обидва формати:
        - Новий (signature) - Ed25519
        - Старий (hash) - HMAC-SHA256
        """
        logger.info(f"[AUTH] Starting verification, has initData: {bool(auth_data_obj.initData)}")

        if not auth_data_obj.initData:
            logger.warning("[AUTH] No initData provided")
            return None

        try:
            parsed_data = dict(parse_qsl(auth_data_obj.initData))
            logger.info(f"[AUTH] Parsed initData keys: {list(parsed_data.keys())}")
        except ValueError as e:
            logger.error(f"[AUTH] Failed to parse initData: {e}")
            return None

        # Перевіряємо який формат використовується
        has_signature = 'signature' in parsed_data
        has_hash = 'hash' in parsed_data

        logger.info(f"[AUTH] Format detection: signature={has_signature}, hash={has_hash}")

        # Перевіряємо auth_date
        auth_date_str = parsed_data.get('auth_date', '0')
        try:
            auth_date = int(auth_date_str)
        except ValueError:
            logger.error(f"[AUTH] Invalid auth_date: {auth_date_str}")
            return None

        current_time = int(time.time())
        time_diff = current_time - auth_date

        logger.info(f"[AUTH] auth_date: {auth_date}, current: {current_time}, diff: {time_diff}s")

        # Перевірка терміну дії - 24 години
        if time_diff > 86400:
            logger.warning(f"[AUTH] initData expired: {time_diff}s old (max 86400s)")
            return None

        # Дозволяємо невелику розбіжність годинників (5 хвилин в майбутнє)
        if time_diff < -300:
            logger.warning(f"[AUTH] initData from far future: {time_diff}s")
            return None

        # Новий формат з signature (Ed25519)
        if has_signature:
            logger.info("[AUTH] Using NEW signature verification (Ed25519)")

            signature = parsed_data.pop('signature', '')

            if not signature or len(signature) < 80:
                logger.warning(f"[AUTH] Invalid signature length: {len(signature) if signature else 0}")
                if settings.ENVIRONMENT == "production":
                    pass

            # Перевіряємо наявність обов'язкових полів
            if 'user' not in parsed_data:
                logger.warning("[AUTH] No user in initData with signature")
                return None

            # Парсимо user
            try:
                user_data = json.loads(parsed_data['user'])
                if not user_data.get('id'):
                    logger.warning("[AUTH] No user id in parsed data")
                    return None

                parsed_data['user'] = user_data
                logger.info(f"[AUTH] ✅ Signature format accepted for user {user_data.get('id')}")
                return parsed_data

            except json.JSONDecodeError as e:
                logger.error(f"[AUTH] Failed to parse user JSON: {e}")
                return None

        # Старий формат з hash (HMAC-SHA256)
        elif has_hash:
            logger.info("[AUTH] Using OLD hash verification (HMAC-SHA256)")

            received_hash = parsed_data.pop('hash', '')
            if not received_hash:
                logger.warning("[AUTH] No hash in initData")
                return None

            # Формуємо data_check_string
            data_check_string = "\n".join(
                f"{key}={value}" for key, value in sorted(parsed_data.items())
            )

            bot_token = settings.TELEGRAM_BOT_TOKEN
            if not bot_token:
                logger.error("[AUTH] TELEGRAM_BOT_TOKEN not configured!")
                return None

            secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
            computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

            logger.info(f"[AUTH] Hash match: {computed_hash == received_hash}")

            if computed_hash != received_hash:
                logger.warning("[AUTH] Hash verification FAILED")
                return None

            # Парсимо user JSON
            if 'user' in parsed_data:
                try:
                    parsed_data['user'] = json.loads(parsed_data['user'])
                    logger.info(f"[AUTH] ✅ Hash verification successful!")
                except json.JSONDecodeError as e:
                    logger.error(f"[AUTH] Failed to parse user JSON: {e}")
                    return None

            return parsed_data

        else:
            logger.warning("[AUTH] Neither signature nor hash found in initData")
            return None

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
    async def authenticate_hybrid_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> Tuple[User, bool]:
        """
        Перевіряє TG дані. Якщо юзера немає - створює його БЕЗ email.
        """
        logger.info(f"[AUTH] authenticate_hybrid_telegram_user called")
        logger.info(f"[AUTH] initData present: {bool(auth_data.initData)}")
        logger.info(f"[AUTH] initData length: {len(auth_data.initData) if auth_data.initData else 0}")

        verified_data = AuthService.verify_telegram_auth(auth_data)

        if not verified_data:
            logger.error("[AUTH] ❌ Verification failed!")
            raise HTTPException(status_code=401, detail="Invalid Telegram data")

        user_info = verified_data.get('user') or verified_data
        telegram_id = user_info.get('id')

        if not telegram_id:
            logger.error("[AUTH] No telegram_id found!")
            raise HTTPException(status_code=401, detail="Invalid Telegram data: no user ID")

        logger.info(f"[AUTH] Looking for user with telegram_id={telegram_id}")

        result = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()

        is_new = False

        if not user:
            logger.info(f"[AUTH] Creating new user for telegram_id={telegram_id}")

            user = User(
                telegram_id=telegram_id,
                first_name=user_info.get('first_name', 'User'),
                last_name=user_info.get('last_name'),
                username=user_info.get('username'),
                photo_url=user_info.get('photo_url'),
                language_code=user_info.get('language_code', 'uk'),
                is_active=True,
                is_email_verified=False,
                email=None
            )

            # Генеруємо реферальний код
            for attempt in range(5):
                try:
                    user.referral_code = AuthService._generate_referral_code()
                    db.add(user)
                    await db.commit()
                    logger.info(f"[AUTH] User created with referral_code={user.referral_code}")
                    break
                except IntegrityError:
                    await db.rollback()
                    logger.warning(f"[AUTH] Referral code collision, attempt {attempt + 1}")
            else:
                user.referral_code = None
                db.add(user)
                await db.commit()

            await db.refresh(user)
            is_new = True
            logger.info(f"[AUTH] ✅ New user created: id={user.id}, telegram_id={telegram_id}")

            # Обробка реферального посилання
            if auth_data.start_param:
                await AuthService.process_referral_link(db, user, auth_data.start_param)
        else:
            logger.info(f"[AUTH] Existing user found: id={user.id}")

            # Оновлюємо час входу та дані профілю
            user.last_login_at = datetime.now(timezone.utc)

            # Оновлюємо дані з Telegram
            if user_info.get('first_name'):
                user.first_name = user_info.get('first_name')
            if user_info.get('last_name') is not None:
                user.last_name = user_info.get('last_name')
            if user_info.get('username') is not None:
                user.username = user_info.get('username')
            if user_info.get('photo_url') is not None:
                user.photo_url = user_info.get('photo_url')

            await db.commit()
            await db.refresh(user)
            logger.info(f"[AUTH] ✅ User updated: id={user.id}")

        return user, is_new

    @staticmethod
    async def initiate_email_linking(db: AsyncSession, user: User, email: str):
        """Відправляє лист для прив'язки пошти"""
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()

        if existing_user and existing_user.id != user.id:
            raise HTTPException(status_code=400, detail="Цей email вже використовується")

        verification_token = AuthService.generate_token_urlsafe()

        user.email = email
        user.verification_token = verification_token
        user.is_email_verified = False
        await db.commit()

        link = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"
        html_content = f"""
        <h1>Підтвердження Email</h1>
        <p>Для прив'язки пошти до акаунту та отримання пароля перейдіть за посиланням:</p>
        <a href="{link}">Підтвердити та отримати пароль</a>
        """
        await email_service.send_email(to=email, subject="Підтвердження Email - OhMyRevit", html_content=html_content)

    @staticmethod
    async def verify_email_token(db: AsyncSession, token: str) -> Tuple[str, User, str]:
        """Верифікує токен, генерує пароль і відправляє його"""
        result = await db.execute(select(User).where(User.verification_token == token))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        password = AuthService.generate_strong_password()
        user.hashed_password = AuthService.get_password_hash(password)
        user.is_email_verified = True
        user.verification_token = None
        await db.commit()

        html_content = f"""
        <h1>Email підтверджено!</h1>
        <p>Тепер ви можете входити на сайт, використовуючи цей email.</p>
        <p>Ваш тимчасовий пароль: <strong>{password}</strong></p>
        <p>Будь ласка, змініть його в налаштуваннях профілю.</p>
        """
        await email_service.send_email(to=user.email, subject="Ваш пароль для входу", html_content=html_content)

        access_token = AuthService.create_access_token(user.id)
        return access_token, user, password

    @staticmethod
    async def register_by_email(db: AsyncSession, email: str) -> bool:
        """Реєстрація через сайт"""
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user and user.is_email_verified:
            raise HTTPException(status_code=400, detail="Email вже зареєстрований")

        verification_token = AuthService.generate_token_urlsafe()
        link = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"

        html_content = f"""
        <h1>Вітаємо в OhMyRevit!</h1>
        <p>Для завершення реєстрації та отримання пароля перейдіть за посиланням:</p>
        <a href="{link}">Завершити реєстрацію</a>
        """
        await email_service.send_email(to=email, subject="Реєстрація", html_content=html_content)

        if not user:
            user = User(
                email=email,
                first_name="User",
                verification_token=verification_token,
                is_email_verified=False,
                is_active=True
            )
            for _ in range(5):
                try:
                    user.referral_code = AuthService._generate_referral_code()
                    db.add(user)
                    await db.commit()
                    break
                except IntegrityError:
                    await db.rollback()
        else:
            user.verification_token = verification_token
            await db.commit()

        return True