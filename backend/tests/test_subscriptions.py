"""
backend/tests/test_subscriptions.py - ВИПРАВЛЕНА ВЕРСІЯ
Тести для підписок з OMR Coins (без Cryptomus)
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.users.models import User
from app.products.models import Product, ProductType
from app.subscriptions.models import Subscription, SubscriptionStatus, UserProductAccess
from datetime import datetime, timedelta, timezone


@pytest.mark.anyio
async def test_get_subscription_price(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест отримання ціни підписки."""
    referred_user.balance = 300
    await db_session.commit()

    response = await authorized_client.get("/api/v1/subscriptions/price")
    assert response.status_code == 200
    data = response.json()

    assert data["price_coins"] == 500
    assert data["price_usd"] == 5.0
    assert data["user_balance"] == 300
    assert data["has_enough_balance"] is False
    assert data["shortfall"] == 200


@pytest.mark.anyio
async def test_create_subscription_checkout(authorized_client: AsyncClient, db_session: AsyncSession,
                                            referred_user: User):
    """Тест покупки підписки за монети."""
    # Даємо достатньо монет для підписки
    referred_user.balance = 1000
    await db_session.commit()

    response = await authorized_client.post("/api/v1/subscriptions/checkout")
    assert response.status_code == 200
    data = response.json()

    # Перевіряємо нову структуру відповіді
    assert data["success"] is True
    assert data["subscription_id"] is not None
    assert data["coins_spent"] == 500
    assert data["new_balance"] == 500

    # Перевірка в БД - підписка одразу активна
    sub_res = await db_session.execute(
        select(Subscription).where(Subscription.user_id == referred_user.id)
    )
    subscription = sub_res.scalar_one_or_none()
    assert subscription is not None
    assert subscription.status == SubscriptionStatus.ACTIVE


@pytest.mark.anyio
async def test_subscription_checkout_insufficient_funds(authorized_client: AsyncClient, db_session: AsyncSession,
                                                        referred_user: User):
    """Тест покупки підписки без достатньої кількості монет."""
    referred_user.balance = 100
    await db_session.commit()

    response = await authorized_client.post("/api/v1/subscriptions/checkout")
    assert response.status_code == 402

    data = response.json()
    detail = data.get("detail", {})
    assert detail.get("error") == "insufficient_funds"
    assert detail.get("required_coins") == 500
    assert detail.get("shortfall") == 400


@pytest.mark.anyio
async def test_get_status_no_subscription(authorized_client: AsyncClient):
    """Тест статусу, коли підписки немає."""
    response = await authorized_client.get("/api/v1/subscriptions/status")
    assert response.status_code == 200
    data = response.json()
    assert data["has_active_subscription"] is False
    assert data["subscription"] is None


@pytest.mark.anyio
async def test_get_status_with_active_subscription(authorized_client: AsyncClient, db_session: AsyncSession,
                                                   referred_user: User):
    """Тест статусу, коли є активна підписка."""
    active_sub = Subscription(
        user_id=referred_user.id,
        start_date=datetime.now(timezone.utc) - timedelta(days=10),
        end_date=datetime.now(timezone.utc) + timedelta(days=20),
        status=SubscriptionStatus.ACTIVE
    )
    db_session.add(active_sub)
    await db_session.commit()

    response = await authorized_client.get("/api/v1/subscriptions/status")
    assert response.status_code == 200
    data = response.json()
    assert data["has_active_subscription"] is True
    assert data["subscription"]["days_remaining"] >= 19


@pytest.mark.anyio
async def test_subscription_grants_access_to_premium(authorized_client: AsyncClient, db_session: AsyncSession,
                                                     referred_user: User, test_products):
    """Тест: підписка надає доступ до преміум товарів."""
    referred_user.balance = 1000
    await db_session.commit()

    response = await authorized_client.post("/api/v1/subscriptions/checkout")
    assert response.status_code == 200

    premium_products = [p for p in test_products if p.product_type == ProductType.PREMIUM]

    access_count_res = await db_session.execute(
        select(func.count(UserProductAccess.id)).where(
            UserProductAccess.user_id == referred_user.id
        )
    )
    access_count = access_count_res.scalar_one()
    assert access_count >= len(premium_products)


@pytest.mark.anyio
async def test_cancel_auto_renewal(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест скасування автопродовження."""
    # Створюємо активну підписку
    active_sub = Subscription(
        user_id=referred_user.id,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=SubscriptionStatus.ACTIVE,
        is_auto_renewal=True
    )
    db_session.add(active_sub)
    await db_session.commit()

    response = await authorized_client.delete("/api/v1/subscriptions/cancel")
    assert response.status_code == 200

    await db_session.refresh(active_sub)
    assert active_sub.is_auto_renewal is False
    assert active_sub.status == SubscriptionStatus.ACTIVE  # Підписка залишається активною


@pytest.mark.anyio
async def test_enable_auto_renewal(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест увімкнення автопродовження."""
    active_sub = Subscription(
        user_id=referred_user.id,
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=SubscriptionStatus.ACTIVE,
        is_auto_renewal=False
    )
    db_session.add(active_sub)
    await db_session.commit()

    response = await authorized_client.post("/api/v1/subscriptions/auto-renewal/enable")
    assert response.status_code == 200

    await db_session.refresh(active_sub)
    assert active_sub.is_auto_renewal is True


@pytest.mark.anyio
async def test_subscription_extension(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест продовження існуючої підписки."""
    # Створюємо активну підписку що закінчується через 5 днів
    original_end = datetime.now(timezone.utc) + timedelta(days=5)
    active_sub = Subscription(
        user_id=referred_user.id,
        start_date=datetime.now(timezone.utc) - timedelta(days=25),
        end_date=original_end,
        status=SubscriptionStatus.ACTIVE
    )
    db_session.add(active_sub)

    referred_user.balance = 1000
    await db_session.commit()

    response = await authorized_client.post("/api/v1/subscriptions/checkout")
    assert response.status_code == 200
    data = response.json()

    assert data["is_extension"] is True

    # Перевіряємо що дата закінчення продовжилась на 30 днів від попередньої
    sub_res = await db_session.execute(
        select(Subscription)
        .where(Subscription.user_id == referred_user.id)
        .order_by(Subscription.end_date.desc())
    )
    latest_sub = sub_res.scalars().first()

    expected_end = original_end + timedelta(days=30)
    assert abs((latest_sub.end_date - expected_end).total_seconds()) < 60  # Допуск 1 хвилина