import logging
from typing import Optional
from fastapi import APIRouter, Depends, status, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.telegram_service import telegram_service
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.users.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/webhook", tags=["Bot Webhook"])


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


# Базові повідомлення (якщо реферала немає)
WELCOME_MESSAGES = {
    "uk": "👋 *Ласкаво просимо!*\n\nТисни кнопку нижче, щоб відкрити маркет.",
    "ru": "👋 *Добро пожаловать!*\n\nНажми кнопку ниже, чтобы открыть маркет.",
    "en": "👋 *Welcome!*\n\nClick the button below to open the market."
}

# Повідомлення, якщо користувача запросили
REFERRAL_WELCOME_MESSAGES = {
    "uk": "👋 *Привіт!*\n\nВас запросив користувач *@{username}* (або *{name}*).\nТисни кнопку нижче, щоб отримати свій бонус! 🎁",
    "ru": "👋 *Привет!*\n\nВас пригласил пользователь *@{username}* (или *{name}*).\nЖми кнопку ниже, чтобы получить свой бонус! 🎁",
    "en": "👋 *Hi!*\n\nYou were invited by *@{username}* (or *{name}*).\nClick the button below to claim your bonus! 🎁"
}


@router.post(f"/{settings.TELEGRAM_BOT_TOKEN}")
async def telegram_webhook(update: Update):
    if not update.message or not update.message.from_user or not update.message.text:
        return Response(status_code=status.HTTP_200_OK)

    message = update.message
    user_data = update.message.from_user
    chat_id = message.chat.id

    if message.text.startswith("/start"):
        parts = message.text.split()
        start_param = parts[1] if len(parts) > 1 else None

        referrer_name = None
        referrer_username = None

        # Створення користувача та пошук реферера
        async with AsyncSessionLocal() as db:
            # 1. Створюємо/знаходимо поточного юзера
            result = await db.execute(select(User).where(User.telegram_id == user_data.id))
            user = result.scalar_one_or_none()
            if not user:
                user = User(
                    telegram_id=user_data.id,
                    first_name=user_data.first_name,
                    username=user_data.username,
                    language_code=user_data.language_code or 'uk',
                    referral_code=AuthService._generate_referral_code()
                )
                db.add(user)
                await db.commit()  # Важливо комітити, щоб ID з'явився

            # 2. Шукаємо, хто запросив (щоб показати ім'я)
            if start_param:
                # Шукаємо реферера в базі
                ref_res = await db.execute(select(User).where(User.referral_code == start_param))
                referrer = ref_res.scalar_one_or_none()
                if referrer:
                    referrer_name = referrer.first_name
                    referrer_username = referrer.username or "unknown"
                    logger.info(f"Found referrer for start message: {referrer_name} (@{referrer_username})")

        lang = user_data.language_code if user_data.language_code in ["uk", "ru", "en"] else 'en'

        # Вибираємо текст повідомлення
        if referrer_name:
            template = REFERRAL_WELCOME_MESSAGES.get(lang, REFERRAL_WELCOME_MESSAGES["en"])
            text = template.format(username=referrer_username, name=referrer_name)
        else:
            text = WELCOME_MESSAGES.get(lang, WELCOME_MESSAGES["en"])

        # Формуємо кнопку
        web_app_url = settings.FRONTEND_URL
        if start_param:
            base = settings.FRONTEND_URL.rstrip('/')
            web_app_url = f"{base}?startapp={start_param}"
            logger.info(f"🔗 Generated Ref Link with param: {web_app_url}")

        web_app_button = {
            "text": "🚀 Open App",
            "web_app": {"url": web_app_url}
        }

        await telegram_service.send_message(
            chat_id=chat_id,
            text=text,
            reply_markup={"inline_keyboard": [[web_app_button]]}
        )

    return Response(status_code=status.HTTP_200_OK)