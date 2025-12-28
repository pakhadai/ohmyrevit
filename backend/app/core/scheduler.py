import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, and_

from app.core.database import AsyncSessionLocal
from app.subscriptions.service import SubscriptionService
from app.core.telegram_service import telegram_service
from app.core.config import settings
from app.users.models import User

logger = logging.getLogger(__name__)

ADMIN_TELEGRAM_IDS = getattr(settings, 'ADMIN_TELEGRAM_IDS', [])


async def notify_admins(message: str):
    for admin_id in ADMIN_TELEGRAM_IDS:
        try:
            await telegram_service.send_message(admin_id, message)
        except Exception as e:
            logger.error(f"Failed to notify admin {admin_id}: {e}")


async def cleanup_unverified_accounts():
    """
    Видаляє акаунти, які не підтвердили email протягом 1 години.

    Умови для видалення:
    - email не None (тобто це email-реєстрація)
    - is_email_verified = False
    - має verification_token (процес верифікації не завершений)
    - created_at старіший за 1 годину
    - немає telegram_id (не Telegram користувач)
    """
    try:
        async with AsyncSessionLocal() as db:
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)

            # Знаходимо неактивовані акаунти
            stmt = select(User).where(
                and_(
                    User.email.isnot(None),  # Має email
                    User.is_email_verified.is_(False),  # Не підтверджений
                    User.verification_token.isnot(None),  # Токен верифікації
                    User.created_at < cutoff_time,  # Старіший за 1 годину
                    User.telegram_id.is_(None)  # Не Telegram користувач
                )
            )

            result = await db.execute(stmt)
            unverified_users = result.scalars().all()

            if unverified_users:
                deleted_count = 0
                for user in unverified_users:
                    # Подвійна перевірка - НЕ видаляти підтверджені акаунти
                    if user.is_email_verified:
                        logger.warning(
                            f"⚠️ Skipping verified account: {user.email} "
                            f"(should not be in cleanup list!)"
                        )
                        continue

                    logger.info(
                        f"Deleting unverified account: {user.email} "
                        f"(created at {user.created_at}, "
                        f"verified: {user.is_email_verified})"
                    )
                    await db.delete(user)
                    deleted_count += 1

                await db.commit()
                logger.info(
                    f"✅ Cleanup: Deleted {deleted_count} "
                    f"unverified email accounts"
                )
                return deleted_count
            else:
                logger.debug("Cleanup: No unverified accounts to delete")
                return 0

    except Exception as e:
        logger.error(
            f"Error during unverified accounts cleanup: {e}",
            exc_info=True
        )
        return 0


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
                    logger.info(
                        f"Scheduler: Marked {expired_count} "
                        f"subscriptions as EXPIRED"
                    )

                cancelled_count = (
                    await service.cancel_stale_pending_subscriptions()
                )
                if cancelled_count > 0:
                    logger.info(
                        f"Scheduler: Cancelled {cancelled_count} "
                        f"stale PENDING subscriptions"
                    )

                renewal_result = await service.process_auto_renewals()
                if (renewal_result["renewed"] > 0 or
                        renewal_result["failed"] > 0):
                    logger.info(
                        f"Scheduler: Auto-renewals processed - "
                        f"renewed: {renewal_result['renewed']}, "
                        f"failed: {renewal_result['failed']}, "
                        f"skipped: {renewal_result['skipped']}"
                    )

            # Очищення непідтверджених акаунтів
            deleted_count = await cleanup_unverified_accounts()
            if deleted_count > 0:
                logger.info(
                    f"Scheduler: Deleted {deleted_count} "
                    f"unverified email accounts"
                )

            elapsed = (
                (datetime.now(timezone.utc) - start_time).total_seconds()
            )
            logger.info(f"Scheduler cycle completed in {elapsed:.2f}s")

            consecutive_errors = 0

        except Exception as e:
            consecutive_errors += 1
            logger.error(
                f"Scheduler error (attempt {consecutive_errors}): {e}",
                exc_info=True
            )

            if consecutive_errors >= max_consecutive_errors:
                error_message = (
                    f"🚨 SCHEDULER ERROR\n\n"
                    f"Scheduler failed {consecutive_errors} times "
                    f"consecutively.\n"
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
                logger.info(
                    f"Daily check: {expired_count} subscriptions expired"
                )

                result = await service.process_auto_renewals()
                logger.info(
                    f"Daily renewal: renewed={result['renewed']}, "
                    f"failed={result['failed']}, "
                    f"skipped={result['skipped']}"
                )

                if result['renewed'] > 0 or result['failed'] > 0:
                    summary = (
                        f"📊 Daily Subscription Report\n\n"
                        f"✅ Renewed: {result['renewed']}\n"
                        f"❌ Failed: {result['failed']}\n"
                        f"⏭️ Skipped: {result['skipped']}\n"
                        f"🗑️ Expired: {expired_count}\n"
                        f"📅 {datetime.now(timezone.utc)}"
                        f".strftime('%Y-%m-%d %H:%M UTC')"
                    )
                    await notify_admins(summary)

        except asyncio.CancelledError:
            logger.info("Daily renewal scheduler stopped")
            break
        except Exception as e:
            logger.error(
                f"Daily renewal scheduler error: {e}",
                exc_info=True
            )
            await notify_admins(
                f"🚨 Daily renewal error: {str(e)[:200]}"
            )
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
