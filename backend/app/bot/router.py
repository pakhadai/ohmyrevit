# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/bot/router.py
import logging
from typing import Optional
from fastapi import APIRouter, Depends, status, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.telegram_service import telegram_service
from app.core.database import get_db, AsyncSessionLocal
from app.users.models import User
from app.referrals.models import ReferralLog, ReferralBonusType
from app.users.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["Bot Webhook"])


# --- Pydantic моделі для Telegram Update ---

class TelegramUser(BaseModel):
    id: int
    is_bot: bool
    first_name: str
    last_name: Optional[str] = None
    username: Optional[str] = None
    language_code: Optional[str] = 'uk'


class Chat(BaseModel):
    id: int
    type: str


class Message(BaseModel):
    message_id: int
    from_user: Optional[TelegramUser] = Field(None, alias='from')
    chat: Chat
    date: int
    text: Optional[str] = None


class Update(BaseModel):
    update_id: int
    message: Optional[Message] = None


# --- Локалізація вітальних повідомлень ---

WELCOME_MESSAGES = {
    "uk": (
        "👋 *Ласкаво просимо до OhMyRevit!*\n\n"
        "Це офіційний бот маркетплейсу найкращого контенту для Autodesk Revit.\n\n"
        "Натисніть кнопку нижче, щоб відкрити каталог сімейств, плагінів та шаблонів."
    ),
    "ru": (
        "👋 *Добро пожаловать в OhMyRevit!*\n\n"
        "Это официальный бот маркетплейса лучшего контента для Autodesk Revit.\n\n"
        "Нажмите кнопку ниже, чтобы открыть каталог семейств, плагинов и шаблонов."
    ),
    "en": (
        "👋 *Welcome to OhMyRevit!*\n\n"
        "This is the official bot for the marketplace of the best content for Autodesk Revit.\n\n"
        "Click the button below to open the catalog of families, plugins, and templates."
    ),
}


# --- Вебхук ---

@router.post(f"/{settings.TELEGRAM_BOT_TOKEN}")
async def telegram_webhook(update: Update):
    if not update.message or not update.message.from_user or not update.message.text:
        return Response(status_code=status.HTTP_200_OK)

    message = update.message
    user_data = update.message.from_user
    chat_id = message.chat.id

    if message.text.startswith("/start"):
        logger.info(f"Received /start command from user {user_data.id}")

        parts = message.text.split()
        start_param = None
        if len(parts) > 1:
            start_param = parts[1]
            logger.info(f"Found start_param in message: {start_param}")
            async with AsyncSessionLocal() as db:
                await process_referral(db, user_data, start_param)

        lang = user_data.language_code if user_data.language_code in WELCOME_MESSAGES else 'en'
        welcome_text = WELCOME_MESSAGES[lang]

        # OLD: web_app_button = {
        # OLD:     "text": "🚀 Відкрити маркет",
        # OLD:     "web_app": {"url": settings.FRONTEND_URL}
        # OLD: }
        # ВИПРАВЛЕНО: Завжди використовуємо URL фронтенду.
        # Логіка рефералів тепер обробляється виключно на бекенді при отриманні команди /start.
        web_app_button = {
            "text": "🚀 Відкрити маркет",
            "web_app": {"url": settings.FRONTEND_URL}
        }

        reply_markup = {"inline_keyboard": [[web_app_button]]}

        await telegram_service.send_message(
            chat_id=chat_id,
            text=welcome_text,
            reply_markup=reply_markup
        )

    return Response(status_code=status.HTTP_200_OK)


async def process_referral(db: AsyncSession, invited_user_data: TelegramUser, referrer_code: str):
    """
    Обробляє реферальний код: знаходить/створює користувача та нараховує бонус.
    """
    # 1. Знаходимо того, хто запросив (реферера)
    referrer_res = await db.execute(select(User).where(User.referral_code == referrer_code))
    referrer = referrer_res.scalar_one_or_none()

    if not referrer:
        logger.warning(f"Referrer with code {referrer_code} not found.")
        return

    # 2. Знаходимо або створюємо запрошеного користувача
    invited_user_res = await db.execute(select(User).where(User.telegram_id == invited_user_data.id))
    invited_user = invited_user_res.scalar_one_or_none()

    is_new_user = not invited_user
    if is_new_user:
        logger.info(f"Creating new referred user {invited_user_data.id} via webhook")
        invited_user = User(
            telegram_id=invited_user_data.id,
            first_name=invited_user_data.first_name,
            last_name=invited_user_data.last_name,
            username=invited_user_data.username,
            language_code=invited_user_data.language_code
        )
        db.add(invited_user)
        await db.flush()

    if invited_user.id == referrer.id:
        logger.warning(f"User {invited_user.id} tried to use their own referral code.")
        return

    # OLD: # 3. Перевіряємо, чи користувач не намагається активувати власний код
    # OLD: # і чи не був він вже кимось запрошений
    # OLD: if invited_user.id == referrer.id or invited_user.referrer_id is not None:
    # OLD:     logger.info(f"User {invited_user.id} already has a referrer or is the referrer themselves.")
    # OLD:     await db.commit()  # Зберігаємо нового користувача, якщо він був створений
    # OLD:     return
    # ВИПРАВЛЕНО: Обробляємо тільки якщо користувач новий і ще не має реферера
    if is_new_user and invited_user.referrer_id is None:
        invited_user.referrer_id = referrer.id
        referrer.bonus_balance += settings.REFERRAL_REGISTRATION_BONUS

        db.add(ReferralLog(
            referrer_id=referrer.id,
            referred_user_id=invited_user.id,
            bonus_type=ReferralBonusType.REGISTRATION,
            bonus_amount=settings.REFERRAL_REGISTRATION_BONUS
        ))

        logger.info(f"Referral successful: User {referrer.id} invited {invited_user.id}. Bonus added.")
        await db.commit()
    else:
        logger.info(f"User {invited_user.id} is not new or already has a referrer. No bonus will be added.")
        await db.commit()  # Все одно зберігаємо нового користувача, якщо він був створений