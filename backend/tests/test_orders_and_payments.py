import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.orders.models import Order, OrderStatus
from app.products.models import Product
from app.subscriptions.models import UserProductAccess
from decimal import Decimal

pytestmark = pytest.mark.asyncio


class TestOrdersAndPayments:
    async def test_create_order_with_promo(self, authorized_client: AsyncClient, db_session: AsyncSession,
                                           test_products: list[Product], test_promo_code: dict):
        """Тест створення замовлення з промокодом."""
        product_ids = [p.id for p in test_products if p.product_type == 'premium']
        response = await authorized_client.post("/orders/checkout",
                                                json={"product_ids": product_ids, "promo_code": test_promo_code.code})
        assert response.status_code == 200
        data = response.json()
        assert "payment_url" in data

        order = await db_session.get(Order, data["order_id"])
        assert order is not None
        assert order.discount_amount > 0
        assert order.promo_code_id == test_promo_code.id

    async def test_create_order_with_bonuses(self, authorized_client: AsyncClient, db_session: AsyncSession,
                                             referred_user: User, test_products: list[Product]):
        """Тест створення замовлення з використанням бонусів."""
        product_ids = [p.id for p in test_products if p.product_type == 'premium']
        response = await authorized_client.post("/orders/checkout",
                                                json={"product_ids": product_ids, "use_bonus_points": 500})
        assert response.status_code == 200
        data = response.json()
        assert "payment_url" in data

        order = await db_session.get(Order, data["order_id"])
        assert order is not None
        assert order.bonus_used == 500  # 500 бонусів = $5
        assert order.discount_amount == Decimal("5.00")

        await db_session.refresh(referred_user)
        assert referred_user.bonus_balance == 500  # 1000 - 500

    async def test_free_order_grants_access_immediately(self, authorized_client: AsyncClient, db_session: AsyncSession,
                                                        test_products: list[Product]):
        """Тест, що повністю безкоштовне замовлення одразу надає доступ."""
        free_product_id = next(p.id for p in test_products if p.product_type == 'free')

        response = await authorized_client.post("/orders/checkout", json={"product_ids": [free_product_id]})
        assert response.status_code == 200
        data = response.json()
        assert data["payment_url"] is None
        assert data["amount"] == 0.0

        order = await db_session.get(Order, data["order_id"])
        assert order.status == OrderStatus.PAID

        access = await db_session.execute(
            select(UserProductAccess).where(UserProductAccess.product_id == free_product_id))
        assert access.scalar_one_or_none() is not None

    async def test_webhook_successful_payment(self, async_client: AsyncClient, db_session: AsyncSession,
                                              referred_user: User, test_products: list[Product]):
        """Тест вебхука для успішної оплати, що надає доступ та реферальний бонус."""
        premium_product = next(p for p in test_products if p.product_type == 'premium')

        # Створюємо замовлення
        order = Order(user_id=referred_user.id, subtotal=premium_product.price, final_total=premium_product.price)
        db_session.add(order)
        await db_session.commit()
        await db_session.refresh(order)

        # Імітуємо вебхук
        webhook_payload = {
            "uuid": f"payment_{order.id}",
            "order_id": str(order.id),
            "status": "paid",
            "amount": str(premium_product.price)
        }

        response = await async_client.post("/orders/webhooks/cryptomus", json=webhook_payload)
        assert response.status_code == 200

        await db_session.refresh(order)
        assert order.status == OrderStatus.PAID

        # Перевірка доступу
        access = await db_session.execute(select(UserProductAccess).where(UserProductAccess.user_id == referred_user.id,
                                                                          UserProductAccess.product_id == premium_product.id))
        assert access.scalar_one_or_none() is not None

        # Перевірка реферального бонусу
        referrer = await db_session.get(User, referred_user.referrer_id)
        assert referrer is not None
        expected_bonus = int(order.final_total * Decimal('0.05') * 100)
        # Початковий баланс реферера - 0, тому новий баланс має дорівнювати бонусу.
        assert referrer.bonus_balance == expected_bonus