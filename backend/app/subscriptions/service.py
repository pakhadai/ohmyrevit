from sqlalchemy.ext.asyncio import AsyncSession
from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus
from app.products.models import Product
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, update


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(self, user_id: int) -> Subscription:
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.now(timezone.utc)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("У вас вже є активна підписка")

        subscription = Subscription(
            user_id=user_id,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
        )
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription

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