# backend/tests/test_simple.py
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_check(async_client: AsyncClient):
    """
    Простий тест для перевірки, що тестове середовище працює
    і додаток відповідає на запити.
    """
    response = await async_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data


@pytest.mark.anyio
async def test_root_endpoint(async_client: AsyncClient):
    """Тест кореневого endpoint."""
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data