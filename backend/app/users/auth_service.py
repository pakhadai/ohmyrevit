import hashlib
import hmac
import time
import json
from urllib.parse import parse_qsl
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
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
from app.core.translations import get_text

logger = logging.getLogger(__name__)


class AuthService:

    @staticmethod
    def verify_telegram_auth(auth_data_obj: TelegramAuthData) -> Optional[dict]:
        if settings.ENVIRONMENT == 'development' and settings.DEBUG:
            if auth_data_obj.id and not auth_data_obj.initData:
                return auth_data_obj.model_dump()
            if not settings.TELEGRAM_BOT_TOKEN:
                return {"user": {"id": 12345, "first_name": "DevUser"}}

        if not auth_data_obj.initData:
            logger.error("initData is missing")
            return None

        try:
            parsed_data = dict(parse_qsl(auth_data_obj.initData))
        except ValueError:
            logger.error("Failed to parse initData")
            return None

        received_hash = parsed_data.pop('hash', '')
        if not received_hash:
            logger.error("Hash missing in initData")
            return None

        auth_date = int(parsed_data.get('auth_date', 0))
        try:
            if time.time() - auth_date > 86400:
                logger.warning(f"Auth data outdated. Diff: {time.time() - auth_date}")
                return None
        except (ValueError, TypeError):
            return None

        data_check_string = "\n".join(
            f"{key}={value}" for key, value in sorted(parsed_data.items())
        )

        secret_key = hmac.new(b"WebAppData", settings.TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
        computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

        if computed_hash != received_hash:
            logger.error(f"Hash mismatch! Expected: {computed_hash}, Got: {received_hash}")
            return None

        if 'user' in parsed_data:
            try:
                parsed_data['user'] = json.loads(parsed_data['user'])
            except json.JSONDecodeError:
                logger.error("Failed to decode user JSON in initData")
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
            lang = referrer.language_code or "uk"
            message = get_text(
                "auth_new_referral_msg",
                lang,
                user_name=user.first_name,
                bonus_amount=bonus_amount
            )
            await telegram_service.send_message(referrer.telegram_id, message)
        except Exception as e:
            logger.error(f"Failed to send referral notification: {e}")

    @staticmethod
    async def authenticate_telegram_user(
            db: AsyncSession,
            auth_data: TelegramAuthData
    ) -> Tuple[User, bool]:

        verified_data = AuthService.verify_telegram_auth(auth_data)

        if not verified_data:
            if not auth_data.initData and auth_data.id:
                user_data = auth_data.model_dump()
                user_id = user_data.get('id')
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=get_text("auth_error_invalid_telegram_data", "uk")
                )
        else:
            user_info = verified_data.get('user')
            if user_info and isinstance(user_info, dict):
                user_id = user_info.get('id')
            else:
                user_id = verified_data.get('id')

            start_param = verified_data.get('start_param')

        if not user_id:
            raise HTTPException(status_code=400, detail="User ID missing in data")

        result = await db.execute(select(User).where(User.telegram_id == user_id))
        user = result.scalar_one_or_none()

        is_new_user_response = not user or user.last_login_at is None

        src = user_info if verified_data else auth_data.model_dump()

        username = src.get('username')
        first_name = src.get('first_name') or f'User {user_id}'
        last_name = src.get('last_name')
        photo_url = src.get('photo_url')
        language_code = src.get('language_code', 'uk')

        try:
            if not user:
                user = User(
                    telegram_id=user_id,
                    username=username,
                    first_name=first_name,
                    last_name=last_name,
                    language_code=language_code,
                    photo_url=photo_url,
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
                    raise HTTPException(
                        status_code=500,
                        detail="Referral code error"
                    )

                users_count_res = await db.execute(select(func.count(User.id)))
                if users_count_res.scalar_one() == 1:
                    user.is_admin = True
            else:
                user.username = username
                user.first_name = first_name
                user.last_name = last_name
                user.photo_url = photo_url
                user.last_login_at = datetime.now(timezone.utc)
                if not user.referral_code:
                    user.referral_code = AuthService._generate_referral_code()

            referral_param = start_param or auth_data.start_param
            if referral_param:
                await AuthService.process_referral_link(db, user, referral_param)

            await db.commit()
            await db.refresh(user)

            return user, is_new_user_response

        except Exception as e:
            await db.rollback()
            logger.error(f"Auth DB error: {e}")
            raise HTTPException(status_code=500, detail=str(e))