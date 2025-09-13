import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.orders.models import Order, OrderStatus, PromoCode
from app.products.models import Product
from app.subscriptions.models import UserProductAccess
from decimal import Decimal


@pytest.mark.anyio
async def test_create_order_with_promo(authorized_client: AsyncClient, db_session: AsyncSession,
                                       test_products: list[Product], test_promo_code: PromoCode):
    product_ids = [p.id for p in test_products if p.product_type == 'premium']
    response = await authorized_client.post("/orders/checkout",
                                            json={"product_ids": product_ids, "promo_code": test_promo_code.code})
    assert response.status_code == 200
    data = response.json()
    order = await db_session.get(Order, data["order_id"])
    assert order.promo_code_id == test_promo_code.id


@pytest.mark.anyio
async def test_create_order_with_bonuses(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User,
                                         test_products: list[Product]):
    product_ids = [p.id for p in test_products if p.product_type == 'premium']
    response = await authorized_client.post("/orders/checkout",
                                            json={"product_ids": product_ids, "use_bonus_points": 500})
    assert response.status_code == 200
    order = await db_session.get(Order, response.json()["order_id"])
    assert order.bonus_used == 500
    await db_session.refresh(referred_user)
    assert referred_user.bonus_balance == 500


@pytest.mark.anyio
async def test_free_order_grants_access_immediately(authorized_client: AsyncClient, db_session: AsyncSession,
                                                    test_products: list[Product]):
    free_product_id = next(p.id for p in test_products if p.product_type == 'free')
    response = await authorized_client.post("/orders/checkout", json={"product_ids": [free_product_id]})
    assert response.status_code == 200
    order = await db_session.get(Order, response.json()["order_id"])
    assert order.status == OrderStatus.PAID
    access_result = await db_session.execute(
        select(UserProductAccess).where(UserProductAccess.product_id == free_product_id))
    assert access_result.scalar_one_or_none() is not None


@pytest.mark.anyio
async def test_webhook_successful_payment(async_client: AsyncClient, db_session: AsyncSession, referred_user: User,
                                          test_products: list[Product]):
    premium_product = next(p for p in test_products if p.product_type == 'premium')
    order = Order(user_id=referred_user.id, subtotal=premium_product.price, final_total=premium_product.price)
    db_session.add(order)
    await db_session.commit()

    webhook_payload = {"uuid": f"payment_{order.id}", "order_id": str(order.id), "status": "paid",
                       "amount": str(premium_product.price)}
    response = await async_client.post("/orders/webhooks/cryptomus", json=webhook_payload)
    assert response.status_code == 200
    await db_session.refresh(order)
    assert order.status == OrderStatus.PAID