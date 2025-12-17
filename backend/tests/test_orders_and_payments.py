"""
backend/tests/test_orders_and_payments.py - ВИПРАВЛЕНА ВЕРСІЯ
Тести для замовлень з OMR Coins (без Cryptomus)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.users.models import User
from app.orders.models import Order, OrderStatus, PromoCode
from app.products.models import Product
from app.subscriptions.models import UserProductAccess
from decimal import Decimal


@pytest.mark.anyio
async def test_create_order_with_coins(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        referred_user: User
):
    """Тест створення замовлення з оплатою монетами"""
    # Переконуємося що є достатньо монет
    referred_user.balance = 5000  # 5000 монет = $50
    await db_session.commit()

    # Обираємо преміум товар
    product_ids = [p.id for p in test_products if p.product_type == 'premium']

    response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": product_ids}
    )

    assert response.status_code == 200
    data = response.json()

    # Перевіряємо структуру відповіді
    assert data.get("success") is True
    assert "order_id" in data
    assert "coins_spent" in data
    assert "new_balance" in data

    # Перевіряємо що монети списалися
    assert data["new_balance"] < 5000

    # Перевіряємо замовлення в БД
    order = await db_session.get(Order, data["order_id"])
    assert order is not None
    assert order.status == OrderStatus.PAID


@pytest.mark.anyio
async def test_create_order_with_promo(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        test_promo_code: PromoCode,
        referred_user: User
):
    """Тест створення замовлення з промокодом"""
    # Даємо достатньо монет
    referred_user.balance = 5000
    await db_session.commit()

    product_ids = [p.id for p in test_products if p.product_type == 'premium']

    response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": product_ids, "promo_code": test_promo_code.code}
    )

    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True

    # Перевіряємо що знижка застосувалась
    order = await db_session.get(Order, data["order_id"])
    assert order.promo_code_id == test_promo_code.id


@pytest.mark.anyio
async def test_create_order_insufficient_funds(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        referred_user: User
):
    """Тест замовлення з недостатнім балансом"""
    # Встановлюємо малий баланс
    referred_user.balance = 10  # Тільки 10 монет
    await db_session.commit()

    product_ids = [p.id for p in test_products if p.product_type == 'premium']

    response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": product_ids}
    )

    # Повинна бути помилка 402 Payment Required
    assert response.status_code == 402
    data = response.json()
    detail = data.get("detail", {})
    assert detail.get("error") == "insufficient_funds"
    assert "required_coins" in detail
    assert "current_balance" in detail
    assert "shortfall" in detail


@pytest.mark.anyio
async def test_create_free_order(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        referred_user: User
):
    """Тест замовлення безкоштовного товару"""
    # Знаходимо безкоштовний товар
    free_product_id = next(p.id for p in test_products if p.product_type == 'free')

    initial_balance = referred_user.balance

    response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": [free_product_id]}
    )

    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True

    # Перевіряємо що баланс не змінився
    assert data["coins_spent"] == 0
    assert data["new_balance"] == initial_balance

    # Перевіряємо замовлення в БД
    order = await db_session.get(Order, data["order_id"])
    assert order.status == OrderStatus.PAID

    # Перевіряємо доступ до товару
    access_count_res = await db_session.execute(
        select(func.count(UserProductAccess.id)).where(
            UserProductAccess.product_id == free_product_id,
            UserProductAccess.user_id == referred_user.id
        )
    )
    assert access_count_res.scalar_one() == 1


@pytest.mark.anyio
async def test_preview_order(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        referred_user: User
):
    """Тест перегляду інформації про замовлення перед оплатою"""
    referred_user.balance = 5000
    await db_session.commit()

    product_ids = [p.id for p in test_products if p.product_type == 'premium']
    product_ids_str = ",".join(map(str, product_ids))

    response = await authorized_client.get(
        f"/api/v1/orders/preview?product_ids={product_ids_str}"
    )

    assert response.status_code == 200
    data = response.json()

    # Перевіряємо структуру відповіді
    assert "items" in data
    assert "subtotal_coins" in data
    assert "final_coins" in data
    assert "user_balance" in data
    assert "has_enough_balance" in data


@pytest.mark.anyio
async def test_cannot_buy_same_product_twice(
        authorized_client: AsyncClient,
        db_session: AsyncSession,
        test_products: list[Product],
        referred_user: User
):
    """Тест: не можна купити той самий товар двічі"""
    referred_user.balance = 10000
    await db_session.commit()

    product_ids = [p.id for p in test_products if p.product_type == 'premium'][:1]

    # Перша покупка - успішна
    response1 = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": product_ids}
    )
    assert response1.status_code == 200

    # Друга покупка того ж товару - помилка
    response2 = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": product_ids}
    )
    # Повинна бути помилка (вже є доступ)
    assert response2.status_code in [400, 409]
