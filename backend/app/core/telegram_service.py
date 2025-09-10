# backend/app/core/telegram_service.py
"""
Сервіс для взаємодії з Telegram Bot API
"""
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_message(self, chat_id: int, text: str, parse_mode: str = "Markdown") -> bool:
        """
        Надсилає повідомлення користувачу через Telegram Bot API.

        Args:
            chat_id: ID чату (telegram_id користувача).
            text: Текст повідомлення.
            parse_mode: Режим парсингу (Markdown, HTML).

        Returns:
            True у разі успіху, інакше False.
        """
        if not self.bot_token:
            logger.error("TELEGRAM_BOT_TOKEN не налаштовано. Повідомлення не відправлено.")
            return False

        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                logger.info(f"Повідомлення успішно надіслано користувачу {chat_id}")
                return True
        except httpx.HTTPStatusError as e:
            logger.error(f"Помилка Telegram API: {e.response.status_code} - {e.response.text}")
            return False
        except Exception as e:
            logger.error(f"Не вдалося надіслати повідомлення користувачу {chat_id}: {e}")
            return False

# Створюємо єдиний екземпляр сервісу
telegram_service = TelegramService(bot_token=settings.TELEGRAM_BOT_TOKEN)