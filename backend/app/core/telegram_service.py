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


    async def notify_creator_application_approved(
            self,
            chat_id: int,
            username: str
    ) -> bool:
        """Нотифікація креатору про схвалення заявки"""
        text = f"""
🎉 *Вітаємо, {username}!*

Ваша заявка на статус креатора була *схвалена*!

Тепер ви можете:
✅ Додавати свої товари
✅ Встановлювати ціни (мін. $2)
✅ Отримувати 85% від продажів
✅ Переглядати статистику
✅ Запитувати виплати

Перейдіть до кабінету креатора, щоб додати свій перший товар!
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "🎨 Кабінет креатора", "web_app": {"url": f"{settings.FRONTEND_URL}/creator/dashboard"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)

    async def notify_product_approved(
            self,
            chat_id: int,
            product_title: str,
            product_id: int
    ) -> bool:
        """Нотифікація креатору про схвалення товару"""
        text = f"""
✅ *Товар схвалено!*

Ваш товар *"{product_title}"* пройшов модерацію та опублікований на маркетплейсі!

Тепер користувачі можуть знайти та придбати ваш плагін. Ви отримаєте 85% від кожного продажу.

💡 *Поради для успішних продажів:*
• Оновлюйте опис товару зі зворотнім зв'язком
• Додавайте більше скріншотів
• Відповідайте на питання користувачів
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "👁️ Переглянути товар", "web_app": {"url": f"{settings.FRONTEND_URL}/product/{product_id}"}}],
                [{"text": "📊 Статистика", "web_app": {"url": f"{settings.FRONTEND_URL}/creator/dashboard"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)

    async def notify_product_rejected(
            self,
            chat_id: int,
            product_title: str,
            rejection_reason: str,
            product_id: int
    ) -> bool:
        """Нотифікація креатору про відхилення товару"""
        text = f"""
❌ *Товар потребує доопрацювання*

Ваш товар *"{product_title}"* на жаль не пройшов модерацію.

*Причина відхилення:*
{rejection_reason}

Будь ласка, виправте зазначені проблеми та відправте товар на модерацію знову.
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "✏️ Редагувати товар", "web_app": {"url": f"{settings.FRONTEND_URL}/creator/products/{product_id}/edit"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)

    async def notify_payout_processed(
            self,
            chat_id: int,
            amount: float,
            method: str
    ) -> bool:
        """Нотифікація креатору про обробку виплати"""
        text = f"""
💰 *Виплата оброблена!*

Ваш запит на виплату був оброблений адміністрацією.

*Сума:* ${amount}
*Метод:* {method}

ℹ️ Кошти надійдуть протягом 1-3 робочих днів залежно від обраного способу виплати.
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "📊 Переглянути статистику", "web_app": {"url": f"{settings.FRONTEND_URL}/creator/dashboard"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)

    async def notify_admin_new_application(
            self,
            chat_id: int,
            user_id: int,
            username: str
    ) -> bool:
        """Нотифікація адміну про нову заявку креатора"""
        text = f"""
📋 *Нова заявка креатора*

Користувач подав заявку на статус креатора та очікує модерації.

*Username:* @{username}
*User ID:* {user_id}
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "👀 Переглянути заявки", "web_app": {"url": f"{settings.FRONTEND_URL}/admin/creators/applications"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)

    async def notify_admin_new_product_moderation(
            self,
            chat_id: int,
            product_title: str,
            author_username: str,
            product_id: int
    ) -> bool:
        """Нотифікація адміну про новий товар на модерації"""
        text = f"""
📦 *Новий товар на модерації*

Креатор @{author_username} відправив товар на модерацію.

*Товар:* {product_title}
*ID:* {product_id}
        """.strip()

        keyboard = {
            "inline_keyboard": [
                [{"text": "🔍 Модерувати", "web_app": {"url": f"{settings.FRONTEND_URL}/admin/creators/products"}}]
            ]
        }

        return await self.send_message(chat_id, text, reply_markup=keyboard)


# Створюємо єдиний екземпляр сервісу
telegram_service = TelegramService(bot_token=settings.TELEGRAM_BOT_TOKEN)