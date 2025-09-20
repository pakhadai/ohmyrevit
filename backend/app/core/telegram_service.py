import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class TelegramService:
    def __init__(self, bot_token: str):
        self.bot_token = bot_token
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"

    async def send_message(
            self,
            chat_id: int,
            text: str,
            parse_mode: str = "Markdown",
            reply_markup: Optional[Dict[str, Any]] = None
    ) -> bool:

        if not self.bot_token:
            logger.error("TELEGRAM_BOT_TOKEN не налаштовано. Повідомлення не відправлено.")
            return False

        url = f"{self.api_url}/sendMessage"
        payload: Dict[str, Any] = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }

        if reply_markup:
            payload["reply_markup"] = reply_markup

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