from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta, timezone
import logging

from app.subscriptions.models import Subscription, UserProductAccess, SubscriptionStatus, AccessType
from app.products.models import Product, ProductType
from app.users.models import User
from app.wallet.models import Transaction, TransactionType
from app.core.config import settings
from app.core.telegram_service import telegram_service

logger = logging.getLogger(__name__)

SUBSCRIPTION_PRICE_COINS = settings.SUBSCRIPTION_PRICE_COINS

class SubscriptionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def purchase_subscription(self, user_id: int) -> dict:

        user_query = select(User).where(User.id == user_id).with_for_update()
        user_res = await self.db.execute(user_query)
        user = user_res.scalar_one_or_none()

        if not user:
            raise ValueError("Користувача не знайдено")

        # Перевіряємо баланс
        if user.balance < SUBSCRIPTION_PRICE_COINS:
            raise ValueError(
                f"INSUFFICIENT_FUNDS|{SUBSCRIPTION_PRICE_COINS}|{user.balance}|{SUBSCRIPTION_PRICE_COINS - user.balance}"
            )

        # Шукаємо активну підписку для продовження
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.now(timezone.utc)
            ).order_by(Subscription.end_date.desc())
        )
        current_subscription = existing.scalar_one_or_none()

        # Визначаємо дати
        is_extension = current_subscription is not None
        if is_extension:
            start_date = current_subscription.end_date
        else:
            start_date = datetime.now(timezone.utc)

        end_date = start_date + timedelta(days=30)

        # Списуємо монети
        user.balance -= SUBSCRIPTION_PRICE_COINS
        new_balance = user.balance

        # Створюємо підписку (одразу активна)
        subscription = Subscription(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            status=SubscriptionStatus.ACTIVE,
            is_auto_renewal=True
        )
        self.db.add(subscription)
        await self.db.flush()  # Отримуємо ID

        # Створюємо транзакцію
        description = "Продовження Premium підписки" if is_extension else "Покупка Premium підписки"
        transaction = Transaction(
            user_id=user_id,
            type=TransactionType.SUBSCRIPTION,
            amount=-SUBSCRIPTION_PRICE_COINS,
            balance_after=new_balance,
            description=f"{description} до {end_date.strftime('%d.%m.%Y')}",
            subscription_id=subscription.id
        )
        self.db.add(transaction)

        # Надаємо доступ до Premium товарів (якщо нова підписка)
        if not is_extension:
            await self._grant_premium_access(user_id)

        await self.db.commit()
        await self.db.refresh(subscription)

        # Сповіщення в Telegram
        try:
            message = (
                f"👑 {'Premium продовжено!' if is_extension else 'Premium активовано!'}\n\n"
                f"💰 Списано: {SUBSCRIPTION_PRICE_COINS} OMR Coins\n"
                f"📅 Діє до: {end_date.strftime('%d.%m.%Y')}\n"
                f"💵 Залишок: {new_balance} монет\n\n"
                f"✨ Всі Premium товари тепер доступні!"
            )
            await telegram_service.send_message(user.telegram_id, message)
        except Exception as e:
            logger.error(f"Failed to send subscription notification: {e}")

        logger.info(
            f"Subscription purchased: user={user_id}, "
            f"subscription_id={subscription.id}, is_extension={is_extension}"
        )

        return {
            "subscription": subscription,
            "coins_spent": SUBSCRIPTION_PRICE_COINS,
            "new_balance": new_balance,
            "is_extension": is_extension
        }

    async def _grant_premium_access(self, user_id: int):
        """Надає доступ до всіх Premium товарів"""
        # Отримуємо всі Premium товари
        premium_products = await self.db.execute(
            select(Product).where(Product.product_type == ProductType.PREMIUM)
        )

        for product in premium_products.scalars():
            # Перевіряємо чи вже є доступ
            existing = await self.db.execute(
                select(UserProductAccess).where(
                    UserProductAccess.user_id == user_id,
                    UserProductAccess.product_id == product.id
                )
            )
            if not existing.scalar_one_or_none():
                self.db.add(UserProductAccess(
                    user_id=user_id,
                    product_id=product.id,
                    access_type=AccessType.SUBSCRIPTION
                ))

    async def cancel_auto_renewal(self, user_id: int) -> bool:
        """
        Скасовує автопродовження.
        Підписка залишається ACTIVE до кінця терміну.
        """
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

        subscription.is_auto_renewal = False
        await self.db.commit()

        logger.info(f"Auto-renewal cancelled for user {user_id}")
        return True

    async def enable_auto_renewal(self, user_id: int) -> bool:
        """Вмикає автопродовження"""
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

        subscription.is_auto_renewal = True
        await self.db.commit()

        return True

    async def get_subscription_status(self, user_id: int) -> dict:
        """Отримує статус підписки користувача"""
        result = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            ).order_by(Subscription.end_date.desc())
        )
        subscription = result.scalar_one_or_none()

        if not subscription:
            return {
                "has_active_subscription": False,
                "subscription": None
            }

        now = datetime.now(timezone.utc)
        days_remaining = max(0, (subscription.end_date - now).days)

        return {
            "has_active_subscription": True,
            "subscription": {
                "id": subscription.id,
                "start_date": subscription.start_date.isoformat(),
                "end_date": subscription.end_date.isoformat(),
                "days_remaining": days_remaining,
                "is_auto_renewal": subscription.is_auto_renewal
            }
        }

    # ============ Scheduler Methods ============

    async def check_and_update_expired(self) -> int:
        """Оновлює статус прострочених підписок"""
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
        """Скасовує старі pending підписки (для legacy)"""
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

    async def process_auto_renewals(self) -> dict:
        """
        Обробляє автопродовження підписок.
        Викликається scheduler'ом раз на день.

        Returns:
            dict: {"renewed": int, "failed": int, "skipped": int}
        """
        now = datetime.now(timezone.utc)
        tomorrow = now + timedelta(days=1)

        # Знаходимо підписки, що закінчуються протягом наступної доби
        # з увімкненим автопродовженням
        result = await self.db.execute(
            select(Subscription)
            .options(selectinload(Subscription.user))
            .where(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.is_auto_renewal == True,
                Subscription.end_date <= tomorrow,
                Subscription.end_date > now
            )
        )
        subscriptions = list(result.scalars().all())

        renewed = 0
        failed = 0
        skipped = 0

        for sub in subscriptions:
            user = sub.user
            if not user:
                skipped += 1
                continue

            # Перевіряємо баланс
            if user.balance < SUBSCRIPTION_PRICE_COINS:
                # Недостатньо коштів - сповіщаємо
                try:
                    shortfall = SUBSCRIPTION_PRICE_COINS - user.balance
                    await telegram_service.send_message(
                        user.telegram_id,
                        f"⚠️ Підписка закінчується {sub.end_date.strftime('%d.%m.%Y')}!\n\n"
                        f"💰 Для автопродовження потрібно: {SUBSCRIPTION_PRICE_COINS} монет\n"
                        f"💵 У вас: {user.balance} монет\n"
                        f"❌ Не вистачає: {shortfall} монет\n\n"
                        f"Поповніть баланс, щоб зберегти Premium!"
                    )
                except Exception as e:
                    logger.error(f"Failed to notify user {user.id} about low balance: {e}")

                failed += 1
                continue

            # Списуємо монети та продовжуємо
            try:
                user.balance -= SUBSCRIPTION_PRICE_COINS
                new_balance = user.balance

                # Продовжуємо підписку на 30 днів
                sub.end_date = sub.end_date + timedelta(days=30)

                # Створюємо транзакцію
                transaction = Transaction(
                    user_id=user.id,
                    type=TransactionType.SUBSCRIPTION,
                    amount=-SUBSCRIPTION_PRICE_COINS,
                    balance_after=new_balance,
                    description=f"Автопродовження Premium до {sub.end_date.strftime('%d.%m.%Y')}",
                    subscription_id=sub.id
                )
                self.db.add(transaction)

                await self.db.commit()

                # Сповіщаємо користувача
                try:
                    await telegram_service.send_message(
                        user.telegram_id,
                        f"✅ Premium автоматично продовжено!\n\n"
                        f"💰 Списано: {SUBSCRIPTION_PRICE_COINS} монет\n"
                        f"📅 Нова дата закінчення: {sub.end_date.strftime('%d.%m.%Y')}\n"
                        f"💵 Залишок: {new_balance} монет"
                    )
                except Exception as e:
                    logger.error(f"Failed to notify user {user.id} about renewal: {e}")

                renewed += 1
                logger.info(f"Auto-renewed subscription {sub.id} for user {user.id}")

            except Exception as e:
                logger.error(f"Failed to auto-renew subscription {sub.id}: {e}")
                await self.db.rollback()
                failed += 1

        return {"renewed": renewed, "failed": failed, "skipped": skipped}

    # ============ Legacy method for compatibility ============

    async def create_subscription(self, user_id: int) -> Subscription:
        """Legacy метод - створює PENDING підписку (для старого коду)"""
        existing = await self.db.execute(
            select(Subscription).where(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.end_date > datetime.now(timezone.utc)
            ).order_by(Subscription.end_date.desc())
        )
        current_subscription = existing.scalar_one_or_none()

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
            is_auto_renewal=True
        )
        self.db.add(subscription)
        await self.db.commit()
        await self.db.refresh(subscription)
        return subscription

    async def cancel_active_subscription(self, user_id: int) -> bool:
        """Legacy alias для cancel_auto_renewal"""
        return await self.cancel_auto_renewal(user_id)