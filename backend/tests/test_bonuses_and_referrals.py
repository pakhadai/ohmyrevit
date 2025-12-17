# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
# OLD: from app.users.models import User
from app.users.models import User
from datetime import date
from freezegun import freeze_time
import time
# ДОДАНО: Імпорти для нового тесту
from sqlalchemy import select
from app.referrals.models import ReferralLog, ReferralBonusType
from app.products.models import Product
from decimal import Decimal
from unittest.mock import AsyncMock


@pytest.mark.anyio
async def test_claim_bonus_first_time(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
# OLD:     response = await authorized_client.post("/profile/bonus/claim")
    response = await authorized_client.post("/api/v1/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["new_streak"] == 1
    await db_session.refresh(referred_user)
    assert referred_user.last_bonus_claim_date == date.today()


@pytest.mark.anyio
async def test_claim_bonus_twice_fails(authorized_client: AsyncClient):
# OLD:     await authorized_client.post("/profile/bonus/claim")
    await authorized_client.post("/api/v1/profile/bonus/claim")
# OLD:     response = await authorized_client.post("/profile/bonus/claim")
    response = await authorized_client.post("/api/v1/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False


@pytest.mark.anyio
@freeze_time("2025-01-01")
async def test_bonus_streak(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
# OLD:     await authorized_client.post("/profile/bonus/claim")
    await authorized_client.post("/api/v1/profile/bonus/claim")
    with freeze_time("2025-01-02"):
# OLD:         response = await authorized_client.post("/profile/bonus/claim")
        response = await authorized_client.post("/api/v1/profile/bonus/claim")
        assert response.json()["new_streak"] == 2
    with freeze_time("2025-01-04"):
# OLD:         response = await authorized_client.post("/profile/bonus/claim")
        response = await authorized_client.post("/api/v1/profile/bonus/claim")
        assert response.json()["new_streak"] == 1


@pytest.mark.anyio
async def test_get_referral_info(async_client: AsyncClient, db_session: AsyncSession, referrer_user: User,
                                 referred_user: User):
    from app.referrals.models import ReferralLog, ReferralBonusType
    db_session.add(ReferralLog(referrer_id=referrer_user.id, referred_user_id=referred_user.id,
                               bonus_type=ReferralBonusType.REGISTRATION, bonus_amount=30))
    await db_session.commit()

    auth_data = {"id": referrer_user.telegram_id, "first_name": referrer_user.first_name, "auth_date": int(time.time()),
                 "hash": "test_hash_for_development"}
    login_res = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    async_client.headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

# OLD:     response = await async_client.get("/profile/referrals")
    response = await async_client.get("/api/v1/profile/referrals")
    assert response.status_code == 200
    data = response.json()
    assert data["referral_code"] == referrer_user.referral_code


@pytest.mark.anyio
async def test_referral_bonus_on_purchase(
    authorized_client: AsyncClient,
    # OLD: db_session: AsyncSession,
    async_client: AsyncClient,
    db_session: AsyncSession,
    referrer_user: User,
    referred_user: User,
    test_products: list[Product],
    monkeypatch
):
    """
    Тест: реферер отримує 5% бонусів від покупки реферала.
    """
    # 1. Запам'ятовуємо початковий баланс реферера
    initial_referrer_balance = referrer_user.balance

    # 2. Обираємо преміум-товар для покупки
    premium_product = next(p for p in test_products if p.product_type == 'premium' and not p.is_on_sale)
    product_price = premium_product.get_actual_price()

    # 3. Імітуємо відповідь від Cryptomus для створення замовлення
    mock_create_payment = AsyncMock(return_value={
        "state": 0,
        "result": {"uuid": "mocked_uuid_purchase", "url": "http://mocked.url/purchase"}
    })
    monkeypatch.setattr("app.payments.cryptomus.CryptomusClient.create_payment", mock_create_payment)

    # 4. Реферал (authorized_client) створює замовлення
    checkout_response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": [premium_product.id]}
    )
    assert checkout_response.status_code == 200
    checkout_data = checkout_response.json()
    order_id = checkout_data["order_id"]

    # 5. Імітуємо успішний вебхук про оплату
    webhook_payload = {
        "uuid": "mocked_uuid_purchase",
        "order_id": str(order_id),
        "status": "paid",
        "amount": str(product_price)
    }
    # OLD: # Використовуємо async_client без авторизації, оскільки вебхук публічний
    # OLD: async with AsyncClient(app=app, base_url="http://test") as client:
    # OLD:     webhook_response = await client.post("/api/v1/orders/webhooks/cryptomus", json=webhook_payload)
    # OLD:     assert webhook_response.status_code == 200
    webhook_response = await async_client.post("/api/v1/orders/webhooks/cryptomus", json=webhook_payload)
    assert webhook_response.status_code == 200

    # 6. Перевіряємо результат
    await db_session.refresh(referrer_user)

    # Розраховуємо очікуваний бонус: 5% від ціни товару, переведені в бонуси (ціна * 0.05 * 100)
    expected_bonus = int(product_price * Decimal('0.05') * 100)

    # Перевіряємо, що баланс реферера збільшився на очікувану суму
    assert referrer_user.balance == initial_referrer_balance + expected_bonus

    # Перевіряємо, що створено відповідний запис в логах
    log_result = await db_session.execute(
        select(ReferralLog).where(
            ReferralLog.referrer_id == referrer_user.id,
            ReferralLog.referred_user_id == referred_user.id,
            ReferralLog.order_id == order_id,
            ReferralLog.bonus_type == ReferralBonusType.PURCHASE
        )
    )
    referral_log_entry = log_result.scalar_one_or_none()
    assert referral_log_entry is not None
    assert referral_log_entry.bonus_amount == expected_bonus
    assert referral_log_entry.purchase_amount == product_price