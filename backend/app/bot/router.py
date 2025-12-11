import logging
from typing import Optional
from fastapi import APIRouter, status, Response
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.config import settings
from app.core.telegram_service import telegram_service
from app.core.database import AsyncSessionLocal
from app.users.models import User
from app.users.auth_service import AuthService
from app.core.translations import get_text

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


@router.post(f"/{settings.TELEGRAM_BOT_TOKEN}")
async def telegram_webhook(update: Update):
    if not update.message or not update.message.from_user or not update.message.text:
        return Response(status_code=status.HTTP_200_OK)

    message = update.message
    user_data = update.message.from_user
    chat_id = message.chat.id

    if message.text.startswith("/start"):
        logger.info(f"📥 Received start command from user {user_data.id}")

        parts = message.text.split()
        start_param = parts[1].strip() if len(parts) > 1 else None

        referrer_name = None

        async with AsyncSessionLocal() as db:
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
                await db.commit()

            if start_param:
                ref_res = await db.execute(select(User).where(User.referral_code == start_param))
                referrer = ref_res.scalar_one_or_none()

                if referrer:
                    if referrer.username:
                        referrer_name = f"@{referrer.username}"
                    else:
                        referrer_name = referrer.first_name

        lang = user_data.language_code or "uk"

        if referrer_name:
            text = get_text("bot_start_referral_welcome", lang, name=referrer_name)
        else:
            text = get_text("bot_start_welcome", lang)

        web_app_url = settings.FRONTEND_URL
        if start_param:
            base = settings.FRONTEND_URL.rstrip('/')
            web_app_url = f"{base}?startapp={start_param}"

        web_app_button = {
            "text": get_text("bot_button_open_app", lang),
            "web_app": {"url": web_app_url}
        }

        await telegram_service.send_message(
            chat_id=chat_id,
            text=text,
            reply_markup={"inline_keyboard": [[web_app_button]]}
        )

    return Response(status_code=status.HTTP_200_OK)