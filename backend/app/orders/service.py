from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.orders.models import Order, OrderItem, PromoCode
from app.products.models import Product
from app.users.models import User
from datetime import datetime


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_discount(
            self,
            subtotal: Decimal,
            promo_code: Optional[str] = None,
            bonus_points: Optional[int] = None
    ) -> tuple[Decimal, str]:
        """
        Розраховує знижку. Повертає (сума_знижки, тип_знижки)
        ВАЖЛИВО: Можна застосувати або промокод АБО бонуси, не обидва
        """
        discount_amount = Decimal(0)
        discount_type = "none"

        # Перевірка: не можна використати обидва типи знижок
        if promo_code and bonus_points:
            raise ValueError("Можна застосувати лише один тип знижки")

        # Промокод
        if promo_code:
            promo = await self.db.execute(
                select(PromoCode).where(
                    PromoCode.code == promo_code,
                    PromoCode.is_active == True
                )
            )
            promo = promo.scalar_one_or_none()

            if promo:
                # Перевірка терміну дії
                if promo.expires_at and promo.expires_at < datetime.utcnow():
                    raise ValueError("Промокод прострочений")

                # Перевірка ліміту використань
                if promo.max_uses and promo.current_uses >= promo.max_uses:
                    raise ValueError("Промокод вже використано максимальну кількість разів")

                # Розрахунок знижки
                if promo.discount_type.value == "percentage":
                    discount_amount = subtotal * (promo.value / 100)
                else:  # fixed
                    discount_amount = min(promo.value, subtotal)

                discount_type = "promo"

                # Оновлюємо лічильник використань
                promo.current_uses += 1

        # Бонуси (100 бонусів = $1, максимум 50% від суми)
        elif bonus_points and bonus_points > 0:
            bonus_value = Decimal(bonus_points / 100)  # конвертація в долари
            max_discount = subtotal * Decimal(0.5)  # максимум 50%
            discount_amount = min(bonus_value, max_discount)
            discount_type = "bonus"

        return discount_amount, discount_type

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