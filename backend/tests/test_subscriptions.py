# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.users.models import User
from app.products.models import Product, ProductType
from app.subscriptions.models import Subscription, SubscriptionStatus, UserProductAccess
# OLD: from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
# ДОДАНО: Імпорт для імітації (mock)
from unittest.mock import AsyncMock


@pytest.mark.anyio
async def test_create_subscription_checkout(authorized_client: AsyncClient, db_session: AsyncSession,
                                            referred_user: User, monkeypatch):
    """Тест створення чекауту для підписки."""
    # Імітуємо відповідь від Cryptomus
    mock_create_payment = AsyncMock(return_value={
        "state": 0,
        "result": {"uuid": "mocked_uuid_sub", "url": "http://mocked.url/sub"}
    })
    monkeypatch.setattr("app.payments.cryptomus.CryptomusClient.create_payment", mock_create_payment)

    response = await authorized_client.post("/api/v1/subscriptions/checkout")
    assert response.status_code == 200
    data = response.json()
    assert "payment_url" in data
    assert data["subscription_id"] is not None

    # Перевірка в БД
    sub_res = await db_session.execute(select(Subscription).where(Subscription.user_id == referred_user.id))
    subscription = sub_res.scalar_one_or_none()
    assert subscription is not None
    assert subscription.status == SubscriptionStatus.PENDING
    mock_create_payment.assert_called_once()


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
# OLD:         start_date=datetime.utcnow() - timedelta(days=10),
# OLD:         end_date=datetime.utcnow() + timedelta(days=20),
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
async def test_webhook_activates_subscription(async_client: AsyncClient, db_session: AsyncSession, referred_user: User,
                                              test_products):
    """Тест: вебхук про оплату активує підписку та надає доступ до преміум товарів."""
    # Створюємо підписку в стані pending
    pending_sub = Subscription(
        user_id=referred_user.id,
# OLD:         start_date=datetime.utcnow(),
# OLD:         end_date=datetime.utcnow() + timedelta(days=30),
        start_date=datetime.now(timezone.utc),
        end_date=datetime.now(timezone.utc) + timedelta(days=30),
        status=SubscriptionStatus.PENDING
    )
    db_session.add(pending_sub)
    await db_session.commit()

    premium_products_count = len([p for p in test_products if p.product_type == ProductType.PREMIUM])

    webhook_payload = {
        "uuid": f"payment_sub_{pending_sub.id}",
        "order_id": f"sub_{pending_sub.id}",
        "status": "paid",
        "amount": "5.00"
    }

    response = await async_client.post("/api/v1/orders/webhooks/cryptomus", json=webhook_payload)
    assert response.status_code == 200

    await db_session.refresh(pending_sub)
    assert pending_sub.status == SubscriptionStatus.ACTIVE

    # Перевіряємо, що надано доступ до преміум товарів
    access_count_res = await db_session.execute(
        select(func.count(UserProductAccess.id)).where(UserProductAccess.user_id == referred_user.id)
    )
    access_count = access_count_res.scalar_one()
    assert access_count >= premium_products_count