# backend/app/orders/service.py
from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.orders.models import Order, OrderItem, PromoCode, DiscountType # <-- ДОДАНО DiscountType
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
            user_id: int,  # ДОДАНО: ID користувача для перевірки балансу бонусів
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

            if promo.discount_type == DiscountType.PERCENTAGE:
                discount_amount = subtotal * (promo.value / 100)
            else:
                discount_amount = promo.value

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

            # ВИПРАВЛЕНО: Розраховуємо точну суму знижки та кількість використаних бонусів
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

        # Отримуємо товари
        products_result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = products_result.scalars().all()

        if not products:
            raise ValueError("Товари не знайдено")

        # Розраховуємо subtotal
        subtotal = sum(p.get_actual_price() for p in products)
        if subtotal == 0:
            raise ValueError("Не можна створювати замовлення з нульовою вартістю.")

        # Розраховуємо знижку
        discount_data = await self.calculate_discount(
            subtotal, user_id, promo_code, use_bonus_points or 0
        )

        # Фінальна сума
        final_total = subtotal - discount_data["discount_amount"]

        # Створюємо замовлення
        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            discount_amount=discount_data["discount_amount"],
            final_total=max(final_total, Decimal(0)),  # Сума не може бути негативною
            status="pending",
            promo_code_id=discount_data["promo_code_id"],
            bonus_used=discount_data["bonus_used"]
        )
        self.db.add(order)
        await self.db.flush()  # Щоб отримати order.id

        # Додаємо товари до замовлення
        for product in products:
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                price_at_purchase=product.get_actual_price()
            )
            self.db.add(order_item)

        # Якщо використовувались бонуси - списуємо їх
        if discount_data["bonus_used"] > 0:
            user = await self.db.get(User, user_id)
            user.bonus_balance -= discount_data["bonus_used"]

        await self.db.commit()
        await self.db.refresh(order)
        return order