import asyncio
import logging
from datetime import datetime, timezone

from app.core.database import AsyncSessionLocal
from app.subscriptions.service import SubscriptionService

logger = logging.getLogger(__name__)


async def run_subscription_expiration_check():
    """
    Головний scheduler для обробки підписок.
    Запускається при старті сервера і працює безперервно.

    Виконує:
    1. Оновлення статусу прострочених підписок (ACTIVE -> EXPIRED)
    2. Скасування старих PENDING підписок (legacy)
    3. Авто-продовження підписок за монети
    """
    # Чекаємо 60 секунд після старту сервера
    await asyncio.sleep(60)

    logger.info("Subscription scheduler started")

    while True:
        try:
            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)

                # 1. Оновлюємо прострочені підписки
                expired_count = await service.check_and_update_expired()
                if expired_count > 0:
                    logger.info(f"Scheduler: Marked {expired_count} subscriptions as EXPIRED")

                # 2. Скасовуємо старі pending (legacy)
                cancelled_count = await service.cancel_stale_pending_subscriptions()
                if cancelled_count > 0:
                    logger.info(f"Scheduler: Cancelled {cancelled_count} stale PENDING subscriptions")

                # 3. Обробляємо авто-продовження
                renewal_result = await service.process_auto_renewals()
                if renewal_result["renewed"] > 0 or renewal_result["failed"] > 0:
                    logger.info(
                        f"Scheduler: Auto-renewals processed - "
                        f"renewed: {renewal_result['renewed']}, "
                        f"failed: {renewal_result['failed']}, "
                        f"skipped: {renewal_result['skipped']}"
                    )

        except Exception as e:
            logger.error(f"Scheduler error: {e}", exc_info=True)

        # Запускаємо кожні 6 годин
        await asyncio.sleep(6 * 60 * 60)


async def run_daily_subscription_renewal():
    """
    Альтернативний scheduler для авто-продовження.
    Запускається раз на день о 00:00 UTC.

    Можна використовувати замість run_subscription_expiration_check
    якщо потрібен точний час виконання.
    """
    logger.info("Daily subscription renewal scheduler started")

    while True:
        try:
            # Обчислюємо час до наступної півночі UTC
            now = datetime.now(timezone.utc)
            next_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)

            if now >= next_midnight:
                from datetime import timedelta
                next_midnight += timedelta(days=1)

            seconds_until_midnight = (next_midnight - now).total_seconds()

            logger.info(f"Next renewal check at {next_midnight.isoformat()}")
            await asyncio.sleep(seconds_until_midnight)

            # Виконуємо авто-продовження
            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)

                # Оновлюємо прострочені
                expired_count = await service.check_and_update_expired()
                logger.info(f"Daily check: {expired_count} subscriptions expired")

                # Авто-продовження
                result = await service.process_auto_renewals()
                logger.info(
                    f"Daily renewal: renewed={result['renewed']}, "
                    f"failed={result['failed']}, skipped={result['skipped']}"
                )

        except asyncio.CancelledError:
            logger.info("Daily renewal scheduler stopped")
            break
        except Exception as e:
            logger.error(f"Daily renewal scheduler error: {e}", exc_info=True)
            # При помилці чекаємо 1 годину і пробуємо знову
            await asyncio.sleep(3600)


# ============ Manual Trigger Functions ============

async def trigger_subscription_check():
    """
    Ручний запуск перевірки підписок.
    Можна викликати з адмін-ендпоінту.
    """
    async with AsyncSessionLocal() as db:
        service = SubscriptionService(db)

        expired = await service.check_and_update_expired()
        cancelled = await service.cancel_stale_pending_subscriptions()
        renewals = await service.process_auto_renewals()

        return {
            "expired": expired,
            "cancelled_pending": cancelled,
            "renewals": renewals,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }