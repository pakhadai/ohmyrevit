from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.orders.models import Order, OrderItem, PromoCode
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
            promo_code: Optional[str],
            bonus_points: int,
            db: AsyncSession
    ) -> dict:
        """
        Розрахунок знижки
        Можна застосувати АБО промокод АБО бонуси, не обидва
        """
        discount_amount = Decimal(0)
        promo_code_id = None
        bonus_used = 0

        if promo_code and bonus_points > 0:
            raise HTTPException(
                status_code=400,
                detail="Можна застосувати тільки один вид знижки"
            )

        # Перевірка промокоду
        if promo_code:
            result = await db.execute(
                select(PromoCode).where(
                    PromoCode.code == promo_code,
                    PromoCode.is_active == True
                )
            )
            promo = result.scalar_one_or_none()

            if not promo:
                raise HTTPException(status_code=400, detail="Невалідний промокод")

            if promo.discount_type == "percentage":
                discount_amount = subtotal * (promo.value / 100)
            else:
                discount_amount = promo.value

            promo_code_id = promo.id

        # Перевірка бонусів
        elif bonus_points > 0:
            max_bonus_discount = subtotal * Decimal(settings.MAX_BONUS_DISCOUNT_PERCENT / 100)
            bonus_value = Decimal(bonus_points / settings.BONUS_TO_USD_RATE)
            discount_amount = min(bonus_value, max_bonus_discount)
            bonus_used = int(discount_amount * settings.BONUS_TO_USD_RATE)

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
        products = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = products.scalars().all()

        if not products:
            raise ValueError("Товари не знайдено")

        # Розраховуємо subtotal
        subtotal = sum(
            p.sale_price if p.is_on_sale and p.sale_price else p.price
            for p in products
        )

        # Розраховуємо знижку
        discount_amount, discount_type = await self.calculate_discount(
            subtotal, promo_code, use_bonus_points
        )

        # Фінальна сума
        final_total = subtotal - discount_amount

        # Створюємо замовлення
        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            discount_amount=discount_amount,
            final_total=final_total,
            status="pending"
        )
        self.db.add(order)
        await self.db.flush()  # Щоб отримати order.id

        # Додаємо товари до замовлення
        for product in products:
            price = product.sale_price if product.is_on_sale and product.sale_price else product.price
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                price_at_purchase=price
            )
            self.db.add(order_item)

        # Якщо використовувались бонуси - списуємо їх
        if discount_type == "bonus" and use_bonus_points:
            user = await self.db.get(User, user_id)
            points_to_deduct = min(use_bonus_points, user.bonus_balance)
            user.bonus_balance -= points_to_deduct

        await self.db.commit()
        return order

order_service = OrderService()