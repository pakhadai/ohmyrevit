# backend/app/core/scheduler.py
import asyncio
import logging
from app.core.database import AsyncSessionLocal
from app.subscriptions.service import SubscriptionService

logger = logging.getLogger(__name__)


async def run_subscription_expiration_check():
    """
    Періодичне завдання, яке перевіряє та оновлює прострочені підписки.
    """
    while True:
        try:
            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)
                updated_count = await service.check_and_update_expired()
                if updated_count > 0:
                    logger.info(f"Scheduler: Updated {updated_count} expired subscriptions.")
        except Exception as e:
            logger.error(f"Scheduler error during subscription check: {e}", exc_info=True)

        # Запускати кожні 6 годин
        await asyncio.sleep(6 * 60 * 60)