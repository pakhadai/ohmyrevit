import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_order():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Логін
        login_response = await client.post("/api/v1/auth/telegram", json={
            "telegram_id": 123456,
            "first_name": "Test",
            "username": "te"
        })
        token = login_response.json()["access_token"]

        # Створення замовлення
        order_response = await client.post(
            "/api/v1/orders/checkout",
            json={
                "product_ids": [1, 2],
                "promo_code": "TEST10"
            },
            headers={"Authorization": f"Bearer {token}"}
        )

        assert order_response.status_code == 200
        assert "payment_url" in order_response.json()