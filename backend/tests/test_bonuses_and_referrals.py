import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.users.models import User
from datetime import date, timedelta
from freezegun import freeze_time

pytestmark = pytest.mark.asyncio


class TestBonusAndReferrals:
    async def test_claim_bonus_first_time(self, authorized_client: AsyncClient, db_session: AsyncSession,
                                          referred_user: User):
        """Тест першого отримання щоденного бонусу."""
        response = await authorized_client.post("/profile/bonus/claim")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["new_streak"] == 1
        assert data["bonus_amount"] == 10

        await db_session.refresh(referred_user)
        assert referred_user.bonus_streak == 1
        assert referred_user.last_bonus_claim_date == date.today()

    async def test_claim_bonus_twice_fails(self, authorized_client: AsyncClient):
        """Тест, що не можна отримати бонус двічі на день."""
        # Перший раз
        await authorized_client.post("/profile/bonus/claim")

        # Другий раз
        response = await authorized_client.post("/profile/bonus/claim")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "Бонус вже отримано" in data["message"]

    @freeze_time("2025-01-01")
    async def test_bonus_streak(self, authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
        """Тест, що стрік бонусів збільшується."""
        # День 1
        await authorized_client.post("/profile/bonus/claim")
        await db_session.refresh(referred_user)
        assert referred_user.bonus_streak == 1

        # День 2
        with freeze_time("2025-01-02"):
            response = await authorized_client.post("/profile/bonus/claim")
            data = response.json()
            assert data["success"] is True
            assert data["new_streak"] == 2
            assert data["bonus_amount"] == 20

        # Пропускаємо день 3

        # День 4 - стрік має скинутись
        with freeze_time("2025-01-04"):
            response = await authorized_client.post("/profile/bonus/claim")
            data = response.json()
            assert data["success"] is True
            assert data["new_streak"] == 1
            assert data["bonus_amount"] == 10

    async def test_get_referral_info(self, authorized_client: AsyncClient, db_session: AsyncSession,
                                     referrer_user: User, referred_user: User):
        """Тест отримання реферальної інформації."""
        # Створюємо лог реєстрації для реферера, ніби referred_user щойно зареєструвався
        from app.referrals.models import ReferralLog, ReferralBonusType
        log = ReferralLog(
            referrer_id=referrer_user.id,
            referred_user_id=referred_user.id,
            bonus_type=ReferralBonusType.REGISTRATION,
            bonus_amount=30
        )
        db_session.add(log)
        await db_session.commit()

        # Авторизуємось під реферером
        auth_data = {
            "id": referrer_user.telegram_id,
            "first_name": referrer_user.first_name,
            "hash": "test_hash_for_development"
        }
        login_res = await authorized_client.post("/auth/telegram", json=auth_data)
        token = login_res.json()["access_token"]
        authorized_client.headers = {"Authorization": f"Bearer {token}"}

        # Робимо запит
        response = await authorized_client.get("/profile/referrals")
        assert response.status_code == 200
        data = response.json()

        assert data["referral_code"] == referrer_user.referral_code
        assert data["total_referrals"] > 0
        assert len(data["logs"]) == 1
        assert data["logs"][0]["bonus_amount"] == 30
        assert data["logs"][0]["referred_user_name"] == referred_user.first_name