import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.referrals.models import ReferralLog

pytestmark = pytest.mark.asyncio

class TestAuth:
    async def test_new_user_registration(self, async_client: AsyncClient, db_session: AsyncSession):
        """Перевірка реєстрації нового користувача."""
        auth_data = {
            "id": 12345,
            "first_name": "Newbie",
            "username": "new_user",
            "hash": "test_hash_for_development"
        }
        response = await async_client.post("/auth/telegram", json=auth_data)
        assert response.status_code == 200
        data = response.json()
        assert data["is_new_user"] is True
        assert "access_token" in data
        assert data["user"]["telegram_id"] == 12345
        assert data["user"]["first_name"] == "Newbie"

        # Перевірка в базі
        user_in_db = await db_session.get(User, data["user"]["id"])
        assert user_in_db is not None
        assert user_in_db.telegram_id == 12345
        assert user_in_db.referral_code is not None

    async def test_existing_user_login(self, async_client: AsyncClient, referrer_user: User):
        """Перевірка логіну існуючого користувача."""
        auth_data = {
            "id": referrer_user.telegram_id,
            "first_name": "Updated Name",
            "hash": "test_hash_for_development"
        }
        response = await async_client.post("/auth/telegram", json=auth_data)
        assert response.status_code == 200
        data = response.json()
        assert data["is_new_user"] is False
        assert data["user"]["first_name"] == "Updated Name"

    async def test_referral_on_registration(self, async_client: AsyncClient, db_session: AsyncSession, referrer_user: User):
        """Перевірка, що реферер отримує бонус при реєстрації нового користувача."""
        initial_balance = referrer_user.bonus_balance

        auth_data = {
            "id": 54321,
            "first_name": "Invited User",
            "start_param": referrer_user.referral_code,
            "hash": "test_hash_for_development"
        }
        response = await async_client.post("/auth/telegram", json=auth_data)
        assert response.status_code == 200
        new_user_data = response.json()

        # Перевіряємо нового користувача
        new_user = await db_session.get(User, new_user_data["user"]["id"])
        assert new_user.referrer_id == referrer_user.id

        # Перевіряємо реферера
        await db_session.refresh(referrer_user)
        assert referrer_user.bonus_balance == initial_balance + 30

        # Перевіряємо лог
        log_res = await db_session.execute(select(ReferralLog).where(ReferralLog.referrer_id == referrer_user.id))
        log = log_res.scalar_one_or_none()
        assert log is not None
        assert log.referred_user_id == new_user.id
        assert log.bonus_amount == 30
        assert str(log.bonus_type) == "REGISTRATION"