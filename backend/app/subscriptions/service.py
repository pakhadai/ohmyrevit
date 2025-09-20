# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
from sqlalchemy.ext.asyncio import AsyncSession
# # OLD: from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus
from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus
from app.products.models import Product
# OLD: from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
# # OLD: from sqlalchemy import select
from sqlalchemy import select, update


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
# OLD:                 Subscription.end_date > datetime.utcnow()
                Subscription.end_date > datetime.now(timezone.utc)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("У вас вже є активна підписка")

        # Створюємо підписку зі статусом PENDING
        subscription = Subscription(
            user_id=user_id,
# OLD:             start_date=datetime.utcnow(),
# OLD:             end_date=datetime.utcnow() + timedelta(days=30),
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=30),
            # Статус буде PENDING за замовчуванням з моделі
        )
        self.db.add(subscription)
        await self.db.commit() # Зберігаємо, щоб отримати ID для чекауту
        await self.db.refresh(subscription)
        return subscription

    async def check_and_update_expired(self) -> int:
        """
        Перевіряє та оновлює статус прострочених підписок.
        Повертає кількість оновлених підписок.
        """
        # # OLD: expired = await self.db.execute(
        # # OLD:     select(Subscription).where(
        # # OLD:         Subscription.status == SubscriptionStatus.ACTIVE,
        # # OLD:         Subscription.end_date < datetime.utcnow()
        # # OLD:     )
        # # OLD: )
        # # OLD: for subscription in expired.scalars():
        # # OLD:     subscription.status = SubscriptionStatus.EXPIRED
        # # OLD:
        # # OLD: await self.db.commit()
        # ВИПРАВЛЕННЯ: Використовуємо один ефективний UPDATE запит замість SELECT+UPDATE
        stmt = (
            update(Subscription)
            .where(
                Subscription.status == SubscriptionStatus.ACTIVE,
# OLD:                 Subscription.end_date < datetime.utcnow()
                Subscription.end_date < datetime.now(timezone.utc)
            )
            .values(status=SubscriptionStatus.EXPIRED)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount