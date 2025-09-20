# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/orders/service.py
from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
# # OLD: from app.orders.models import Order, OrderItem, PromoCode, DiscountType
from app.orders.models import Order, OrderItem, PromoCode, DiscountType, OrderStatus
from app.products.models import Product
from app.users.models import User
# OLD: from datetime import datetime
from datetime import datetime, timezone
from fastapi import HTTPException
from app.core.config import settings
# ДОДАНО: Імпорти для нової логіки
import logging
from app.subscriptions.models import UserProductAccess, AccessType
from app.referrals.models import ReferralLog, ReferralBonusType

logger = logging.getLogger(__name__)


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_discount(
            self,
            subtotal: Decimal,
            user_id: int,
            promo_code: Optional[str],
            bonus_points: int,
    ) -> dict:
        """
        Розрахунок знижки
        Можна застосувати АБО промокод АБО бонуси, не обидва
        """
        discount_amount = Decimal(0)
        promo_code_id = None
        bonus_used = 0

        if promo_code and bonus_points > 0:
            raise ValueError("Можна застосувати тільки один вид знижки")

        # Перевірка промокоду
        if promo_code:
            result = await self.db.execute(
                select(PromoCode).where(
                    PromoCode.code == promo_code,
                    PromoCode.is_active == True
                )
            )
            promo = result.scalar_one_or_none()

            if not promo:
                raise ValueError("Невалідний або прострочений промокод")

            # # OLD: # ВИПРАВЛЕННЯ: Порівнюємо naive datetime з naive datetime
            # # OLD: if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.utcnow():
            # Повторне виправлення для гарантованої роботи.
# OLD:             if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.utcnow():
            if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.now(timezone.utc):
                raise ValueError("Термін дії промокоду закінчився")

            if promo.max_uses and promo.current_uses >= promo.max_uses:
                raise ValueError("Ліміт використання промокоду вичерпано")

            if promo.discount_type == DiscountType.PERCENTAGE:
                discount_amount = subtotal * (Decimal(promo.value) / 100)
            else:
                discount_amount = min(subtotal, Decimal(promo.value))

            promo_code_id = promo.id

        # Перевірка бонусів
        elif bonus_points > 0:
            user = await self.db.get(User, user_id)
            if not user:
                raise ValueError("Користувача не знайдено")
            if user.bonus_balance < bonus_points:
                raise ValueError("Недостатньо бонусів на рахунку")

            max_bonus_discount = subtotal * Decimal(settings.MAX_BONUS_DISCOUNT_PERCENT)
            bonus_value = Decimal(bonus_points / settings.BONUS_TO_USD_RATE)

            actual_discount = min(bonus_value, max_bonus_discount)
            discount_amount = actual_discount
            bonus_used = int(actual_discount * settings.BONUS_TO_USD_RATE)

        return {
            "discount_amount": discount_amount,
            "promo_code_id": promo_code_id,
            "bonus_used": bonus_used
        }

    async def create_order(
            self,
            user_id: int,
            product_ids: List[int],
            promo_code: Optional[str] = None,
            use_bonus_points: Optional[int] = None
    ) -> Order:
        """Створює замовлення з товарами"""

        products_result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = products_result.scalars().all()

        if not products:
            raise ValueError("Товари не знайдено")

        subtotal = sum(p.get_actual_price() for p in products)
        if subtotal == 0 and not any(p.product_type == 'free' for p in products):
            raise ValueError(
                "Не можна створювати замовлення з нульовою вартістю, якщо в ньому немає безкоштовних товарів.")

        discount_data = await self.calculate_discount(
            subtotal, user_id, promo_code, use_bonus_points or 0
        )

        final_total = subtotal - discount_data["discount_amount"]

        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            discount_amount=discount_data["discount_amount"],
            final_total=max(final_total, Decimal(0)),
            status="pending",
            promo_code_id=discount_data["promo_code_id"],
            bonus_used=discount_data["bonus_used"]
        )

        # ВИПРАВЛЕННЯ: Ідіоматичне створення пов'язаних об'єктів через relationship
        for product in products:
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    price_at_purchase=product.get_actual_price()
                )
            )

        self.db.add(order)
        await self.db.flush()

        # # OLD: for product in products:
        # # OLD:     order_item = OrderItem(
        # # OLD:         order_id=order.id,
        # # OLD:         product_id=product.id,
        # # OLD:         price_at_purchase=product.get_actual_price()
        # # OLD:     )
        # # OLD:     self.db.add(order_item)
        # # OLD:
        # # OLD: await self.db.refresh(order, attribute_names=['items'])

        if discount_data["bonus_used"] > 0:
            user = await self.db.get(User, user_id)
            if user:
                user.bonus_balance -= discount_data["bonus_used"]
                await self.db.flush()

        return order

    # # OLD: async def process_successful_order(self, order: Order) -> Order:
    async def process_successful_order(self, order_id: int) -> Order:
        """
        Централізована обробка успішного замовлення (оплаченого або безкоштовного).
        Змінює статус, надає доступ, оновлює промокоди та нараховує реферальні бонуси.
        """
        # ГАРАНТІЯ НАДІЙНОСТІ: Завжди завантажуємо замовлення з БД з усіма потрібними зв'язками
        order_res = await self.db.execute(
            select(Order).options(
                selectinload(Order.user).selectinload(User.referrer),
                selectinload(Order.items).selectinload(OrderItem.product)
            ).where(Order.id == order_id)
        )
        # # OLD: order = order_res.scalar_one_or_none()
        order = order_res.unique().scalar_one_or_none()

        if not order:
            logger.error(f"Attempted to process non-existent order with ID {order_id}")
            raise ValueError(f"Order with ID {order_id} not found.")

        if order.status == OrderStatus.PAID:
            logger.warning(f"Order {order.id} is already marked as paid. Skipping processing.")
            return order

        # 1. Оновлюємо статус замовлення
        order.status = OrderStatus.PAID
# OLD:         order.paid_at = datetime.utcnow()
        order.paid_at = datetime.now(timezone.utc)

        # 2. Надаємо доступ до товарів
        for item in order.items:
            access_exists_res = await self.db.execute(
                select(UserProductAccess).where(
                    UserProductAccess.user_id == order.user_id,
                    UserProductAccess.product_id == item.product_id
                )
            )
            if not access_exists_res.scalar_one_or_none():
                self.db.add(UserProductAccess(
                    user_id=order.user_id,
                    product_id=item.product_id,
                    access_type=AccessType.PURCHASE
                ))
                logger.info(f"ACCESS GRANTED: User {order.user_id}, Product {item.product_id}")

        # 3. Оновлюємо лічильник промокоду
        if order.promo_code_id:
            promo = await self.db.get(PromoCode, order.promo_code_id)
            if promo:
                promo.current_uses += 1
                logger.info(f"Promo code {promo.code} usage incremented for order {order.id}")

        # 4. Нараховуємо реферальний бонус
        buyer = order.user
        if buyer and buyer.referrer_id:
            referrer = buyer.referrer
            if referrer:
                commission_amount = int(order.final_total * Decimal('0.05') * 100)
                if commission_amount > 0:
                    referrer.bonus_balance += commission_amount
                    self.db.add(ReferralLog(
                        referrer_id=referrer.id,
                        referred_user_id=buyer.id,
                        order_id=order.id,
                        bonus_type=ReferralBonusType.PURCHASE,
                        bonus_amount=commission_amount,
                        purchase_amount=order.final_total
                    ))
                    logger.info(
                        f"REFERRAL: User {referrer.id} received {commission_amount} bonuses for purchase from user {buyer.id}")

        logger.info(f"Order {order.id} processed successfully as PAID.")
        await self.db.flush()
        return order