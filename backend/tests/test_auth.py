import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.referrals.models import ReferralLog
import time

@pytest.mark.anyio
async def test_new_user_registration(async_client: AsyncClient, db_session: AsyncSession):
    auth_data = {
        "id": 12345, "first_name": "Newbie", "username": "new_user",
        "auth_date": int(time.time()), "hash": "test_hash_for_development"
    }
    response = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    assert response.status_code == 200
    data = response.json()
    assert data["is_new_user"] is True
    assert "access_token" in data

@pytest.mark.anyio
async def test_existing_user_login(async_client: AsyncClient, referrer_user: User):
    auth_data = {
        "id": referrer_user.telegram_id, "first_name": "Updated Name",
        "auth_date": int(time.time()), "hash": "test_hash_for_development"
    }
    response = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    assert response.status_code == 200
    data = response.json()
    assert data["is_new_user"] is False

@pytest.mark.anyio
async def test_referral_on_registration(async_client: AsyncClient, db_session: AsyncSession, referrer_user: User):
    initial_balance = referrer_user.bonus_balance
    auth_data = {
        "id": 54321, "first_name": "Invited User", "start_param": referrer_user.referral_code,
        "auth_date": int(time.time()), "hash": "test_hash_for_development"
    }
    response = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    assert response.status_code == 200
    new_user_data = response.json()
    new_user = await db_session.get(User, new_user_data["user"]["id"])
    assert new_user.referrer_id == referrer_user.id
    await db_session.refresh(referrer_user)
    assert referrer_user.bonus_balance == initial_balance + 30