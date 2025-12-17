# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
# OLD: from sqlalchemy import select
from sqlalchemy import select, func
from app.users.models import User
from app.orders.models import Order, OrderStatus, PromoCode
from app.products.models import Product
from app.subscriptions.models import UserProductAccess
from decimal import Decimal
# ДОДАНО: Імпорт для імітації (mock)
from unittest.mock import AsyncMock


@pytest.mark.anyio
async def test_create_order_with_promo(authorized_client: AsyncClient, db_session: AsyncSession,
                                       test_products: list[Product], test_promo_code: PromoCode, monkeypatch):
    # Імітуємо відповідь від Cryptomus
    mock_create_payment = AsyncMock(return_value={
        "state": 0,
        "result": {"uuid": "mocked_uuid", "url": "http://mocked.url/pay"}
    })
    monkeypatch.setattr("app.payments.cryptomus.CryptomusClient.create_payment", mock_create_payment)

    product_ids = [p.id for p in test_products if p.product_type == 'premium']
# OLD:     response = await authorized_client.post("/orders/checkout",
# OLD:                                             json={"product_ids": product_ids, "promo_code": test_promo_code.code})
    response = await authorized_client.post("/api/v1/orders/checkout",
                                            json={"product_ids": product_ids, "promo_code": test_promo_code.code})
    assert response.status_code == 200
    data = response.json()
    order = await db_session.get(Order, data["order_id"])
    assert order.promo_code_id == test_promo_code.id
    mock_create_payment.assert_called_once()


@pytest.mark.anyio
async def test_create_order_with_bonuses(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User,
                                         test_products: list[Product], monkeypatch):
    # Імітуємо відповідь від Cryptomus
    mock_create_payment = AsyncMock(return_value={
        "state": 0,
        "result": {"uuid": "mocked_uuid", "url": "http://mocked.url/pay"}
    })
    monkeypatch.setattr("app.payments.cryptomus.CryptomusClient.create_payment", mock_create_payment)

    product_ids = [p.id for p in test_products if p.product_type == 'premium']
# OLD:     response = await authorized_client.post("/orders/checkout",
# OLD:                                             json={"product_ids": product_ids, "use_bonus_points": 500})
    response = await authorized_client.post("/api/v1/orders/checkout",
                                            json={"product_ids": product_ids, "use_bonus_points": 500})
    assert response.status_code == 200
    order = await db_session.get(Order, response.json()["order_id"])
    await db_session.refresh(referred_user)
    mock_create_payment.assert_called_once()


@pytest.mark.anyio
async def test_free_order_grants_access_immediately(authorized_client: AsyncClient, db_session: AsyncSession,
                                                    test_products: list[Product], referred_user: User):
    free_product_id = next(p.id for p in test_products if p.product_type == 'free')
    assert response.status_code == 200
    order = await db_session.get(Order, response.json()["order_id"])
    assert order.status == OrderStatus.PAID
    access_count_res = await db_session.execute(
        select(func.count(UserProductAccess.id)).where(
            UserProductAccess.product_id == free_product_id,
            UserProductAccess.user_id == referred_user.id
        )
    )
    assert access_count_res.scalar_one() == 1


@pytest.mark.anyio
async def test_webhook_successful_payment(async_client: AsyncClient, db_session: AsyncSession, referred_user: User,
                                          test_products: list[Product]):
    premium_product = next(p for p in test_products if p.product_type == 'premium')
    order = Order(user_id=referred_user.id, subtotal=premium_product.price, final_total=premium_product.price)
    db_session.add(order)
    await db_session.commit()

    webhook_payload = {"uuid": f"payment_{order.id}", "order_id": str(order.id), "status": "paid",
                       "amount": str(premium_product.price)}
# OLD:     response = await async_client.post("/orders/webhooks/cryptomus", json=webhook_payload)
    response = await async_client.post("/api/v1/orders/webhooks/cryptomus", json=webhook_payload)
    assert response.status_code == 200
    await db_session.refresh(order)
    assert order.status == OrderStatus.PAID