# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/orders/service.py
from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.orders.models import Order, OrderItem, PromoCode, DiscountType
from app.products.models import Product
from app.users.models import User
from datetime import datetime
from fastapi import HTTPException
from app.core.config import settings


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

            # OLD: # ВИПРАВЛЕННЯ: Порівнюємо naive datetime з naive datetime
            # OLD: if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.utcnow():
            # Повторне виправлення для гарантованої роботи.
            if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.utcnow():
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
        self.db.add(order)
        await self.db.flush()

        for product in products:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                price_at_purchase=product.get_actual_price()
            )
            self.db.add(order_item)

        await self.db.refresh(order, attribute_names=['items'])

        if discount_data["bonus_used"] > 0:
            user = await self.db.get(User, user_id)
            if user:
                user.bonus_balance -= discount_data["bonus_used"]

        return order