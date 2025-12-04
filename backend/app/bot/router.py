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
    "en": "👋 *Welcome!*\n\nClick the button below to open the market.",
    "de": "👋 *Willkommen!*\n\nKlicken Sie auf die Schaltfläche unten, um den Markt zu öffnen.",
    "es": "👋 *¡Bienvenido!*\n\nHaz clic en el botón de abajo para abrir el mercado."
}

REFERRAL_WELCOME_MESSAGES = {
    "uk": "👋 *Привіт!*\n\nВас запросив користувач *{name}*.\nТисни кнопку нижче, щоб отримати свій бонус! 🎁",
    "ru": "👋 *Привет!*\n\nВас пригласил пользователь *{name}*.\nЖми кнопку ниже, чтобы получить свой бонус! 🎁",
    "en": "👋 *Hi!*\n\nYou were invited by *{name}*.\nClick the button below to claim your bonus! 🎁",
    "de": "👋 *Hallo!*\n\nSie wurden von Benutzer *{name}* eingeladen.\nKlicken Sie unten, um Ihren Bonus zu erhalten! 🎁",
    "es": "👋 *¡Hola!*\n\nHas sido invitado por el usuario *{name}*.\n¡Haz clic en el botón de abajo para obtener tu bono! 🎁"
}


@router.post(f"/{settings.TELEGRAM_BOT_TOKEN}")
async def telegram_webhook(update: Update):
    if not update.message or not update.message.from_user or not update.message.text:
        return Response(status_code=status.HTTP_200_OK)

    message = update.message
    user_data = update.message.from_user
    chat_id = message.chat.id

    if message.text.startswith("/start"):
        logger.info(f"📥 Received start command: '{message.text}' from user {user_data.id}")

        parts = message.text.split()
        start_param = parts[1].strip() if len(parts) > 1 else None

        referrer_name = None

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.telegram_id == user_data.id))
            user = result.scalar_one_or_none()

            if not user:
                logger.info(f"🆕 Creating new user {user_data.id}")
                user = User(
                    telegram_id=user_data.id,
                    first_name=user_data.first_name,
                    username=user_data.username,
                    language_code=user_data.language_code or 'uk',
                    referral_code=AuthService._generate_referral_code()
                )
                db.add(user)
                await db.commit()
            else:
                logger.info(f"ℹ️ User {user_data.id} already exists")

            if start_param:
                logger.info(f"🔍 Searching for referrer with code: '{start_param}'")

                ref_res = await db.execute(select(User).where(User.referral_code == start_param))
                referrer = ref_res.scalar_one_or_none()

                if referrer:
                    if referrer.username:
                        referrer_name = f"@{referrer.username}"
                    else:
                        referrer_name = referrer.first_name

                    logger.info(f"✅ FOUND REFERRER: {referrer_name} (ID: {referrer.id})")
                else:
                    logger.warning(f"❌ Referrer NOT FOUND for code: '{start_param}'")

        lang = user_data.language_code if user_data.language_code in ["uk", "ru", "en", "de", "es"] else 'en'

        if referrer_name:
            text = REFERRAL_WELCOME_MESSAGES.get(lang, REFERRAL_WELCOME_MESSAGES["en"]).format(name=referrer_name)
        else:
            text = WELCOME_MESSAGES.get(lang, WELCOME_MESSAGES["en"])

        web_app_url = settings.FRONTEND_URL
        if start_param:
            base = settings.FRONTEND_URL.rstrip('/')
            web_app_url = f"{base}?startapp={start_param}"
            logger.info(f"🔗 Button Link: {web_app_url}")

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