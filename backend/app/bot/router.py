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


WELCOME_MESSAGES = {
    "uk": "👋 *Ласкаво просимо!*\n\nТисни кнопку нижче, щоб відкрити маркет.",
    "ru": "👋 *Добро пожаловать!*\n\nНажми кнопку ниже, чтобы открыть маркет.",
    "en": "👋 *Welcome!*\n\nClick the button below to open the market."
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
        # Отримуємо код реферала
        start_param = parts[1] if len(parts) > 1 else None

        # Створення користувача в БД, щоб зафіксувати вхід
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.telegram_id == user_data.id))
            user = result.scalar_one_or_none()
            if not user:
                # Якщо користувача немає, створюємо його базову версію
                # Повна реєстрація буде при відкритті WebApp
                user = User(
                    telegram_id=user_data.id,
                    first_name=user_data.first_name,
                    username=user_data.username,
                    language_code=user_data.language_code or 'uk',
                    referral_code=AuthService._generate_referral_code()
                )
                db.add(user)
                await db.commit()

        lang = user_data.language_code if user_data.language_code in WELCOME_MESSAGES else 'en'

        # === ОСНОВНЕ ВИПРАВЛЕННЯ ===
        # Додаємо параметр ?startapp=CODE до URL
        web_app_url = settings.FRONTEND_URL
        if start_param:
            base = settings.FRONTEND_URL.rstrip('/')
            web_app_url = f"{base}?startapp={start_param}"
            logger.info(f"🔗 Generated Ref Link: {web_app_url}")

        web_app_button = {
            "text": "🚀 Open App",
            "web_app": {"url": web_app_url}
        }

        await telegram_service.send_message(
            chat_id=chat_id,
            text=WELCOME_MESSAGES.get(lang, WELCOME_MESSAGES["en"]),
            reply_markup={"inline_keyboard": [[web_app_button]]}
        )

    return Response(status_code=status.HTTP_200_OK)