from sqlalchemy.ext.asyncio import AsyncSession
from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus
from app.products.models import Product
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(self, user_id: int) -> Subscription:
        # Шукаємо найактуальнішу активну підписку
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.now(timezone.utc)
            ).order_by(Subscription.end_date.desc())
        )
        current_subscription = existing.scalar_one_or_none()

        # Логіка визначення дат (для продовження)
        if current_subscription:
            start_date = current_subscription.end_date
        else:
            start_date = datetime.now(timezone.utc)

        end_date = start_date + timedelta(days=30)

        subscription = Subscription(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            status=SubscriptionStatus.PENDING,
            is_auto_renewal=True # Нова підписка завжди з автопродовженням
        )
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription

    async def cancel_active_subscription(self, user_id: int) -> bool:
        """
        Скасовує автопродовження.
        Підписка залишається ACTIVE до кінця терміну.
        """
        # Знаходимо активну підписку
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.now(timezone.utc)
            ).order_by(Subscription.end_date.desc())
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return False

        # 👇 ЛОГІКА ЗМІНЕНА: Не міняємо статус, тільки прапорець
        subscription.is_auto_renewal = False
        await self.db.commit()
        return True

    async def check_and_update_expired(self) -> int:
        stmt = (
            update(Subscription)
            .where(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date < datetime.now(timezone.utc)
            )
            .values(status=SubscriptionStatus.EXPIRED)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount

    async def cancel_stale_pending_subscriptions(self) -> int:
        threshold_time = datetime.now(timezone.utc) - timedelta(hours=24)

        stmt = (
            update(Subscription)
            .where(
                Subscription.status == SubscriptionStatus.PENDING,
                Subscription.created_at < threshold_time
            )
            .values(status=SubscriptionStatus.CANCELLED)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount