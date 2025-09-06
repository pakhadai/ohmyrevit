from sqlalchemy.ext.asyncio import AsyncSession
from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus
from app.products.models import Product
from datetime import datetime, timedelta
from sqlalchemy import select


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(self, user_id: int) -> Subscription:
        """Створює нову підписку на 30 днів зі статусом PENDING"""

        # Перевіряємо чи немає активної підписки
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.utcnow()
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("У вас вже є активна підписка")

        # Створюємо підписку зі статусом PENDING
        subscription = Subscription(
            user_id=user_id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            # Статус буде PENDING за замовчуванням з моделі
        )
        self.db.add(subscription)
        await self.db.commit() # Зберігаємо, щоб отримати ID для чекауту
        await self.db.refresh(subscription)
        return subscription

    async def check_and_update_expired(self):
        """Перевіряє та оновлює статус прострочених підписок"""
        expired = await self.db.execute(
            select(Subscription).where(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date < datetime.utcnow()
            )
        )
        for subscription in expired.scalars():
            subscription.status = SubscriptionStatus.EXPIRED

        await self.db.commit()