import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.users.models import User
from datetime import date
from freezegun import freeze_time
import time


@pytest.mark.anyio
async def test_claim_bonus_first_time(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    response = await authorized_client.post("/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["new_streak"] == 1
    await db_session.refresh(referred_user)
    assert referred_user.last_bonus_claim_date == date.today()


@pytest.mark.anyio
async def test_claim_bonus_twice_fails(authorized_client: AsyncClient):
    await authorized_client.post("/profile/bonus/claim")
    response = await authorized_client.post("/profile/bonus/claim")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False


@pytest.mark.anyio
@freeze_time("2025-01-01")
async def test_bonus_streak(authorized_client: AsyncClient, db_session: AsyncSession, referred_user: User):
    await authorized_client.post("/profile/bonus/claim")
    with freeze_time("2025-01-02"):
        response = await authorized_client.post("/profile/bonus/claim")
        assert response.json()["new_streak"] == 2
    with freeze_time("2025-01-04"):
        response = await authorized_client.post("/profile/bonus/claim")
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

    response = await async_client.get("/profile/referrals")
    assert response.status_code == 200
    data = response.json()
    assert data["referral_code"] == referrer_user.referral_code