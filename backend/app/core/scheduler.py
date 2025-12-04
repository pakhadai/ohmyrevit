import asyncio
import logging
from app.core.database import AsyncSessionLocal
from app.subscriptions.service import SubscriptionService

logger = logging.getLogger(__name__)


async def run_subscription_expiration_check():
    while True:
        try:
            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)

                updated_count = await service.check_and_update_expired()
                if updated_count > 0:
                    logger.info(f"Scheduler: Updated {updated_count} expired subscriptions.")

                cancelled_count = await service.cancel_stale_pending_subscriptions()
                if cancelled_count > 0:
                    logger.info(f"Scheduler: Cancelled {cancelled_count} stale pending subscriptions (older than 24h).")

        except Exception as e:
            logger.error(f"Scheduler error during subscription check: {e}", exc_info=True)

        await asyncio.sleep(6 * 60 * 60)