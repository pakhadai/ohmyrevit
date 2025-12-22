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
from sqlalchemy import select, update, delete, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
import logging

from app.core.config import settings
from app.users.models import User
from app.users.schemas import TelegramAuthData
from app.referrals.models import ReferralLog, ReferralBonusType
from app.orders.models import Order
from app.subscriptions.models import Subscription, UserProductAccess
from app.wallet.models import Transaction
from app.core.telegram_service import telegram_service
from app.core.email import email_service
from app.core.translations import get_text
from app.core.cache import cache

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
        if not auth_data_obj.initData:
            return None

        try:
            parsed_data = dict(parse_qsl(auth_data_obj.initData))
        except ValueError:
            return None

        has_signature = 'signature' in parsed_data
        has_hash = 'hash' in parsed_data

        auth_date_str = parsed_data.get('auth_date', '0')
        try:
            auth_date = int(auth_date_str)
        except ValueError:
            return None

        current_time = int(time.time())
        time_diff = current_time - auth_date

        if time_diff > 86400:
            return None

        if time_diff < -300:
            return None

        if has_signature:
            signature = parsed_data.pop('signature', '')
            if 'user' not in parsed_data:
                return None

            try:
                user_data = json.loads(parsed_data['user'])
                if not user_data.get('id'):
                    return None
                parsed_data['user'] = user_data
                return parsed_data
            except json.JSONDecodeError:
                return None

        elif has_hash:
            received_hash = parsed_data.pop('hash', '')
            if not received_hash:
                return None

            data_check_string = "\n".join(
                f"{key}={value}" for key, value in sorted(parsed_data.items())
            )

            bot_token = settings.TELEGRAM_BOT_TOKEN
            if not bot_token:
                return None

            secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
            computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

            if computed_hash != received_hash:
                return None

            if 'user' in parsed_data:
                try:
                    parsed_data['user'] = json.loads(parsed_data['user'])
                except json.JSONDecodeError:
                    return None

            return parsed_data

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
        verified_data = AuthService.verify_telegram_auth(auth_data)

        if not verified_data:
            raise HTTPException(status_code=401, detail="Invalid Telegram data")

        user_info = verified_data.get('user') or verified_data
        telegram_id = user_info.get('id')

        if not telegram_id:
            raise HTTPException(status_code=401, detail="Invalid Telegram data: no user ID")

        result = await db.execute(select(User).where(User.telegram_id == telegram_id))
        user = result.scalar_one_or_none()

        is_new = False

        if not user:
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

            for attempt in range(5):
                try:
                    user.referral_code = AuthService._generate_referral_code()
                    db.add(user)
                    await db.commit()
                    break
                except IntegrityError:
                    await db.rollback()
            else:
                user.referral_code = None
                db.add(user)
                await db.commit()

            await db.refresh(user)
            is_new = True

            if auth_data.start_param:
                await AuthService.process_referral_link(db, user, auth_data.start_param)
        else:
            user.last_login_at = datetime.now(timezone.utc)
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

        return user, is_new

    @staticmethod
    async def merge_accounts(db: AsyncSession, target_user: User, source_user: User):
        """
        Об'єднує акаунти.
        1. Звільняє telegram_id у source_user (щоб уникнути UniqueConstraint error).
        2. Переносить дані.
        3. Видаляє source_user.
        """
        # Зберігаємо дані джерела перед змінами
        telegram_id = source_user.telegram_id
        photo_url = source_user.photo_url
        first_name = source_user.first_name
        source_balance = source_user.balance
        source_id = source_user.id  # ID потрібен для оновлення залежних таблиць

        # 1. ВАЖЛИВО: Звільняємо telegram_id у старого юзера
        # Це критично, бо інакше при спробі записати telegram_id в target_user виникне помилка
        source_user.telegram_id = None
        await db.flush()  # Записуємо зміну в БД миттєво

        # 2. Оновлюємо цільового користувача
        target_user.telegram_id = telegram_id
        target_user.photo_url = photo_url or target_user.photo_url
        if not target_user.first_name:
            target_user.first_name = first_name

        target_user.last_login_at = datetime.now(timezone.utc)

        # 3. Об'єднуємо баланс
        if source_balance > 0:
            target_user.balance += source_balance

        # 4. Переносимо дані (використовуємо збережений source_id)
        await db.execute(update(Order).where(Order.user_id == source_id).values(user_id=target_user.id))
        await db.execute(update(Transaction).where(Transaction.user_id == source_id).values(user_id=target_user.id))
        await db.execute(update(Subscription).where(Subscription.user_id == source_id).values(user_id=target_user.id))

        await db.execute(update(User).where(User.referrer_id == source_id).values(referrer_id=target_user.id))
        await db.execute(
            update(ReferralLog).where(ReferralLog.referrer_id == source_id).values(referrer_id=target_user.id))

        # 5. Переносимо доступ до продуктів (уникаємо дублікатів)
        source_accesses = await db.execute(select(UserProductAccess).where(UserProductAccess.user_id == source_id))
        target_product_ids_res = await db.execute(
            select(UserProductAccess.product_id).where(UserProductAccess.user_id == target_user.id))
        target_product_ids = set(target_product_ids_res.scalars().all())

        for access in source_accesses.scalars().all():
            if access.product_id not in target_product_ids:
                access.user_id = target_user.id
                db.add(access)
            else:
                await db.delete(access)

        # 6. Видаляємо старий акаунт
        await db.delete(source_user)

        await db.commit()
        await db.refresh(target_user)
        return target_user

    @staticmethod
    async def initiate_email_linking(db: AsyncSession, user: User, email: str):
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()

        verification_token = AuthService.generate_token_urlsafe()
        link = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"

        if existing_user and existing_user.id != user.id:
            # Якщо email зайнятий - перевіряємо, чи це "чистий" веб-акаунт
            if existing_user.telegram_id is not None:
                raise HTTPException(status_code=400, detail="Цей email вже прив'язаний до іншого Telegram акаунту")

            # Зберігаємо токен в існуючого юзера
            existing_user.verification_token = verification_token
            # Зберігаємо ID поточного Telegram-юзера для злиття
            await cache.set(f"merge:{verification_token}", str(user.id), ttl=3600)
            await db.commit()

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }}
                    .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                    .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }}
                    .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }}
                    .content {{ padding: 40px 30px; text-align: center; color: #333333; }}
                    .icon {{ font-size: 48px; margin-bottom: 20px; display: block; }}
                    .title {{ font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a; }}
                    .message {{ font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 32px; }}
                    .btn {{ display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25); transition: background-color 0.2s; }}
                    .btn:hover {{ background-color: #5a6fd6; }}
                    .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>OhMyRevit</h1>
                    </div>
                    <div class="content">
                        <span class="icon">🔄</span>
                        <div class="title">Об'єднання акаунтів</div>
                        <p class="message">
                            Ми помітили, що ви увійшли через Telegram, але у вас вже є акаунт на сайті з поштою <b>{email}</b>.
                            <br><br>
                            Щоб об'єднати їх та перенести весь ваш прогрес, баланс та покупки в один профіль, натисніть кнопку нижче.
                        </p>
                        <a href="{link}" class="btn">Підтвердити та об'єднати</a>
                    </div>
                    <div class="footer">
                        Це посилання дійсне протягом 1 години.<br>
                        Якщо це були не ви, просто проігноруйте цей лист.
                    </div>
                </div>
            </body>
            </html>
            """
            await email_service.send_email(to=email, subject="Об'єднання акаунтів - OhMyRevit",
                                           html_content=html_content)
            return

        # Звичайна прив'язка
        user.email = email
        user.verification_token = verification_token
        user.is_email_verified = False
        await db.commit()

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
                .content {{ padding: 40px 30px; text-align: center; color: #333333; }}
                .icon {{ font-size: 48px; margin-bottom: 20px; display: block; }}
                .title {{ font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a; }}
                .message {{ font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 32px; }}
                .btn {{ display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25); }}
                .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>OhMyRevit</h1>
                </div>
                <div class="content">
                    <span class="icon">✉️</span>
                    <div class="title">Підтвердження Email</div>
                    <p class="message">
                        Дякуємо за реєстрацію! Щоб завершити налаштування профілю та отримати доступ до всіх функцій, підтвердіть вашу електронну адресу.
                    </p>
                    <a href="{link}" class="btn">Підтвердити пошту</a>
                </div>
                <div class="footer">
                    Посилання дійсне протягом 24 годин.
                </div>
            </div>
        </body>
        </html>
        """
        await email_service.send_email(to=email, subject="Підтвердження Email - OhMyRevit", html_content=html_content)

    @staticmethod
    async def verify_email_token(db: AsyncSession, token: str) -> Tuple[str, User, Optional[str]]:
        source_user_id_str = await cache.get(f"merge:{token}")

        result = await db.execute(select(User).where(User.verification_token == token))
        target_user = result.scalar_one_or_none()

        if not target_user:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        # Логіка злиття
        if source_user_id_str:
            source_user = await db.get(User, int(source_user_id_str))

            if source_user:
                target_user = await AuthService.merge_accounts(db, target_user, source_user)

                target_user.verification_token = None
                target_user.is_email_verified = True
                await db.commit()
                await cache.delete(f"merge:{token}")

                access_token = AuthService.create_access_token(target_user.id)
                return access_token, target_user, None

        # Звичайна реєстрація
        password = AuthService.generate_strong_password()
        target_user.hashed_password = AuthService.get_password_hash(password)
        target_user.is_email_verified = True
        target_user.verification_token = None
        await db.commit()

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 30px 20px; text-align: center; color: white; }}
                .content {{ padding: 40px 30px; text-align: center; color: #333333; }}
                .password-box {{ background-color: #f0fdf4; border: 2px dashed #48bb78; border-radius: 12px; padding: 20px; margin: 25px 0; font-family: monospace; font-size: 24px; font-weight: 700; color: #2f855a; letter-spacing: 2px; }}
                .message {{ font-size: 15px; line-height: 1.6; color: #555555; }}
                .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin:0; font-size:24px;">Email підтверджено!</h1>
                </div>
                <div class="content">
                    <p class="message">Ваш акаунт успішно активовано. Ви можете використовувати цей пароль для входу на сайт:</p>
                    <div class="password-box">{password}</div>
                    <p class="message" style="font-size: 13px; color: #777;">Рекомендуємо змінити його в налаштуваннях профілю.</p>
                </div>
                <div class="footer">
                    Команда OhMyRevit
                </div>
            </div>
        </body>
        </html>
        """
        await email_service.send_email(to=target_user.email, subject="Ваш пароль - OhMyRevit",
                                       html_content=html_content)

        access_token = AuthService.create_access_token(target_user.id)
        return access_token, target_user, password

    @staticmethod
    async def register_by_email(db: AsyncSession, email: str) -> bool:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user and user.is_email_verified:
            raise HTTPException(status_code=400, detail="Email вже зареєстрований")

        verification_token = AuthService.generate_token_urlsafe()
        link = f"{settings.FRONTEND_URL}/auth/verify?token={verification_token}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f9; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white; }}
                .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
                .content {{ padding: 40px 30px; text-align: center; color: #333333; }}
                .icon {{ font-size: 48px; margin-bottom: 20px; display: block; }}
                .title {{ font-size: 20px; font-weight: 600; margin-bottom: 16px; color: #1a1a1a; }}
                .message {{ font-size: 15px; line-height: 1.6; color: #555555; margin-bottom: 32px; }}
                .btn {{ display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.25); }}
                .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #999999; border-top: 1px solid #eeeeee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Вітаємо в OhMyRevit!</h1>
                </div>
                <div class="content">
                    <span class="icon">👋</span>
                    <div class="title">Реєстрація акаунту</div>
                    <p class="message">
                        Для завершення реєстрації та отримання пароля перейдіть за посиланням нижче:
                    </p>
                    <a href="{link}" class="btn">Завершити реєстрацію</a>
                </div>
                <div class="footer">
                    Посилання дійсне протягом 24 годин.
                </div>
            </div>
        </body>
        </html>
        """
        await email_service.send_email(to=email, subject="Реєстрація - OhMyRevit", html_content=html_content)

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