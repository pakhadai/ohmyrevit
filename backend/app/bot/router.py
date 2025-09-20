# backend/app/bot/router.py
import logging
from typing import Optional
from fastapi import APIRouter, Request, status, Response

from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.telegram_service import telegram_service

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
    """
    Приймає оновлення від Telegram Bot API.
    Обробляє команду /start.
    """
    if not update.message or not update.message.from_user or not update.message.text:
        return Response(status_code=status.HTTP_200_OK)

    message = update.message
    user = update.message.from_user
    chat_id = message.chat.id

    if message.text.startswith("/start"):
        logger.info(f"Received /start command from user {user.id}")

        # Визначаємо мову користувача
        lang = user.language_code if user.language_code in WELCOME_MESSAGES else 'en'
        welcome_text = WELCOME_MESSAGES[lang]

        # Створюємо кнопку для запуску Mini App
        web_app_button = {
            "text": "🚀 Відкрити маркет",
            "web_app": {"url": settings.FRONTEND_URL}
        }

        # Створюємо клавіатуру
        reply_markup = {
            "inline_keyboard": [[web_app_button]]
        }

        # Надсилаємо повідомлення
        await telegram_service.send_message(
            chat_id=chat_id,
            text=welcome_text,
            reply_markup=reply_markup
        )

    return Response(status_code=status.HTTP_200_OK)