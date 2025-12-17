"""
backend/tests/test_bonuses_and_referrals.py - ВИПРАВЛЕНА ВЕРСІЯ
Тести для бонусної системи та реферальної програми
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.users.models import User
from datetime import date
from freezegun import freeze_time
import time
from sqlalchemy import select
from app.referrals.models import ReferralLog, ReferralBonusType
from app.products.models import Product
from decimal import Decimal
from unittest.mock import AsyncMock


@pytest.mark.anyio
async def test_claim_bonus_first_time(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест першого отримання щоденного бонусу"""
    response = await authorized_client.post("/api/v1/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["new_streak"] == 1
    await db_session.refresh(referred_user)
    assert referred_user.last_bonus_claim_date == date.today()


@pytest.mark.anyio
async def test_claim_bonus_twice_fails(authorized_client: AsyncClient):
    """Тест: не можна отримати бонус двічі за день"""
    await authorized_client.post("/api/v1/profile/bonus/claim")
    response = await authorized_client.post("/api/v1/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False


@pytest.mark.anyio
@freeze_time("2025-01-01")
async def test_bonus_streak(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    """Тест streak бонусів - послідовні дні збільшують streak"""
    await authorized_client.post("/api/v1/profile/bonus/claim")

    with freeze_time("2025-01-02"):
        response = await authorized_client.post("/api/v1/profile/bonus/claim")
        assert response.json()["new_streak"] == 2

    # Пропуск дня скидає streak
    with freeze_time("2025-01-04"):
        response = await authorized_client.post("/api/v1/profile/bonus/claim")
        assert response.json()["new_streak"] == 1


@pytest.mark.anyio
async def test_get_referral_info(async_client: AsyncClient, db_session: AsyncSession, referrer_user: User,
                                 referred_user: User):
    """Тест отримання інформації про реферальну програму"""
    from app.referrals.models import ReferralLog, ReferralBonusType

    # Створюємо запис про реєстрацію реферала
    db_session.add(ReferralLog(
        referrer_id=referrer_user.id,
        referred_user_id=referred_user.id,
        bonus_type=ReferralBonusType.REGISTRATION,
        bonus_amount=30
    ))
    await db_session.commit()

    # Авторизуємось як реферер
    auth_data = {
        "id": referrer_user.telegram_id,
        "first_name": referrer_user.first_name,
        "auth_date": int(time.time()),
        "hash": "test_hash_for_development"
    }
    login_res = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    async_client.headers = {"Authorization": f"Bearer {login_res.json()['access_token']}"}

    response = await async_client.get("/api/v1/profile/referrals")
    assert response.status_code == 200
    data = response.json()
    assert data["referral_code"] == referrer_user.referral_code


@pytest.mark.anyio
async def test_referral_bonus_on_coin_purchase(
        authorized_client: AsyncClient,
        async_client: AsyncClient,
        db_session: AsyncSession,
        referrer_user: User,
        referred_user: User,
        test_products: list[Product],
):
    """
    Тест: реферер отримує 5% бонусів від покупки реферала (OMR Coins версія).
    Новий тест для системи монет замість Cryptomus.
    """
    # 1. Переконуємося що реферал має достатньо монет
    referred_user.balance = 5000  # 5000 монет = $50
    await db_session.commit()

    # 2. Запам'ятовуємо початковий баланс реферера
    initial_referrer_balance = referrer_user.balance

    # 3. Обираємо преміум-товар для покупки
    premium_product = next(p for p in test_products if p.product_type == 'premium' and not p.is_on_sale)

    # Ціна товару в монетах (100 монет = $1)
    product_price_usd = premium_product.get_actual_price()
    product_price_coins = int(product_price_usd * 100)

    # 4. Реферал (authorized_client) створює замовлення - миттєва оплата монетами
    checkout_response = await authorized_client.post(
        "/api/v1/orders/checkout",
        json={"product_ids": [premium_product.id]}
    )

    # Перевіряємо успішну оплату
    assert checkout_response.status_code == 200
    checkout_data = checkout_response.json()
    assert checkout_data.get("success") is True
    order_id = checkout_data["order_id"]

    # 5. Перевіряємо результат - оновлюємо дані з БД
    await db_session.refresh(referrer_user)

    # 6. Розраховуємо очікуваний бонус: 5% від ціни товару в монетах
    expected_bonus = int(product_price_coins * 0.05)

    # 7. Перевіряємо, що баланс реферера збільшився на очікувану суму
    # ВИПРАВЛЕНО: balance замість bonus_balance
    assert referrer_user.balance == initial_referrer_balance + expected_bonus

    # 8. Перевіряємо, що створено відповідний запис в логах
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


# ВИДАЛЕНО/ПРОПУЩЕНО: Старий тест test_referral_bonus_on_purchase з Cryptomus
@pytest.mark.skip(
    reason="Deprecated - Cryptomus integration removed, replaced with test_referral_bonus_on_coin_purchase")
@pytest.mark.anyio
async def test_referral_bonus_on_purchase_DEPRECATED(
        authorized_client: AsyncClient,
        async_client: AsyncClient,
        db_session: AsyncSession,
        referrer_user: User,
        referred_user: User,
        test_products: list[Product],
        monkeypatch
):
    """
    DEPRECATED: Старий тест з Cryptomus webhook.
    Замінено на test_referral_bonus_on_coin_purchase
    """
    pass