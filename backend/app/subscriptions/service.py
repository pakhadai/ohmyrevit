from sqlalchemy.ext.asyncio import AsyncSession
from app.subscriptions.models import Subscription, UserProductAccess
from app.products.models import Product
from datetime import datetime, timedelta
from sqlalchemy import select


class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_subscription(self, user_id: int) -> Subscription:
        """Створює нову підписку на 30 днів"""

        # Перевіряємо чи немає активної підписки
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == "active",
                Subscription.end_date > datetime.utcnow()
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("У вас вже є активна підписка")

        # Створюємо підписку
        subscription = Subscription(
            user_id=user_id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30),
            status="active"
        )
        self.db.add(subscription)

        # Надаємо доступ до всіх поточних преміум товарів
        products = await self.db.execute(
            select(Product).where(Product.product_type == "premium")
        )
        products = products.scalars().all()

        for product in products:
            # Перевіряємо чи вже є доступ
            existing_access = await self.db.execute(
                select(UserProductAccess).where(
                    UserProductAccess.user_id == user_id,
                    UserProductAccess.product_id == product.id
                )
            )
            if not existing_access.scalar_one_or_none():
                access = UserProductAccess(
                    user_id=user_id,
                    product_id=product.id,
                    access_type="subscription",
                    granted_at=datetime.utcnow()
                )
                self.db.add(access)

        await self.db.commit()
        return subscription

    async def check_and_update_expired(self):
        """Перевіряє та оновлює статус прострочених підписок"""
        expired = await self.db.execute(
            select(Subscription).where(
                Subscription.status == "active",
                Subscription.end_date < datetime.utcnow()
            )
        )
        for subscription in expired.scalars():
            subscription.status = "expired"

        await self.db.commit()