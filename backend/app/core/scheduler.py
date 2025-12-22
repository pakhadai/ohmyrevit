import asyncio
import logging
from datetime import datetime, timedelta, timezone

from app.core.database import AsyncSessionLocal
from app.subscriptions.service import SubscriptionService
from app.core.telegram_service import telegram_service
from app.core.config import settings

logger = logging.getLogger(__name__)

ADMIN_TELEGRAM_IDS = getattr(settings, 'ADMIN_TELEGRAM_IDS', [])


async def notify_admins(message: str):
    for admin_id in ADMIN_TELEGRAM_IDS:
        try:
            await telegram_service.send_message(admin_id, message)
        except Exception as e:
            logger.error(f"Failed to notify admin {admin_id}: {e}")


async def run_subscription_expiration_check():
    await asyncio.sleep(60)

    logger.info("Subscription scheduler started")

    consecutive_errors = 0
    max_consecutive_errors = 3

    while True:
        try:
            start_time = datetime.now(timezone.utc)

            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)

                expired_count = await service.check_and_update_expired()
                if expired_count > 0:
                    logger.info(f"Scheduler: Marked {expired_count} subscriptions as EXPIRED")

                cancelled_count = await service.cancel_stale_pending_subscriptions()
                if cancelled_count > 0:
                    logger.info(f"Scheduler: Cancelled {cancelled_count} stale PENDING subscriptions")

                renewal_result = await service.process_auto_renewals()
                if renewal_result["renewed"] > 0 or renewal_result["failed"] > 0:
                    logger.info(
                        f"Scheduler: Auto-renewals processed - "
                        f"renewed: {renewal_result['renewed']}, "
                        f"failed: {renewal_result['failed']}, "
                        f"skipped: {renewal_result['skipped']}"
                    )

            elapsed = (datetime.now(timezone.utc) - start_time).total_seconds()
            logger.info(f"Scheduler cycle completed in {elapsed:.2f}s")

            consecutive_errors = 0

        except Exception as e:
            consecutive_errors += 1
            logger.error(f"Scheduler error (attempt {consecutive_errors}): {e}", exc_info=True)

            if consecutive_errors >= max_consecutive_errors:
                error_message = (
                    f"🚨 SCHEDULER ERROR\n\n"
                    f"Scheduler failed {consecutive_errors} times consecutively.\n"
                    f"Last error: {str(e)[:200]}\n"
                    f"Time: {datetime.now(timezone.utc).isoformat()}"
                )
                await notify_admins(error_message)
                consecutive_errors = 0

        await asyncio.sleep(6 * 60 * 60)


async def run_daily_subscription_renewal():
    logger.info("Daily subscription renewal scheduler started")

    while True:
        try:
            now = datetime.now(timezone.utc)
            next_midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)

            if now >= next_midnight:
                next_midnight += timedelta(days=1)

            seconds_until_midnight = (next_midnight - now).total_seconds()

            logger.info(f"Next renewal check at {next_midnight.isoformat()}")
            await asyncio.sleep(seconds_until_midnight)

            async with AsyncSessionLocal() as db:
                service = SubscriptionService(db)

                expired_count = await service.check_and_update_expired()
                logger.info(f"Daily check: {expired_count} subscriptions expired")

                result = await service.process_auto_renewals()
                logger.info(
                    f"Daily renewal: renewed={result['renewed']}, "
                    f"failed={result['failed']}, skipped={result['skipped']}"
                )

                if result['renewed'] > 0 or result['failed'] > 0:
                    summary = (
                        f"📊 Daily Subscription Report\n\n"
                        f"✅ Renewed: {result['renewed']}\n"
                        f"❌ Failed: {result['failed']}\n"
                        f"⏭️ Skipped: {result['skipped']}\n"
                        f"🗑️ Expired: {expired_count}\n"
                        f"📅 {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
                    )
                    await notify_admins(summary)

        except asyncio.CancelledError:
            logger.info("Daily renewal scheduler stopped")
            break
        except Exception as e:
            logger.error(f"Daily renewal scheduler error: {e}", exc_info=True)
            await notify_admins(f"🚨 Daily renewal error: {str(e)[:200]}")
            await asyncio.sleep(3600)


async def trigger_subscription_check():
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


async def get_scheduler_health():
    return {
        "status": "healthy",
        "last_check": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT
    }