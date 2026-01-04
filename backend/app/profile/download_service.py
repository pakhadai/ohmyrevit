"""
Сервіс для безпечного завантаження файлів з одноразовими токенами
"""
import secrets
from typing import Optional
from app.core.cache import cache


class DownloadTokenService:
    """Сервіс для генерації та перевірки одноразових токенів завантаження"""

    TOKEN_TTL = 300  # 5 хвилин
    TOKEN_PREFIX = "download_token:"

    @classmethod
    async def generate_token(cls, user_id: int, product_id: int) -> str:
        """
        Генерує одноразовий токен для завантаження файлу

        Returns:
            Токен (32 символи hex)
        """
        token = secrets.token_urlsafe(32)
        cache_key = f"{cls.TOKEN_PREFIX}{token}"

        # Зберігаємо в Redis: user_id та product_id
        await cache.set(
            cache_key,
            f"{user_id}:{product_id}",
            ttl=cls.TOKEN_TTL
        )

        return token

    @classmethod
    async def verify_and_consume_token(
        cls,
        token: str,
        expected_user_id: int,
        expected_product_id: int
    ) -> bool:
        """
        Перевіряє токен і видаляє його (одноразове використання)

        Returns:
            True якщо токен валідний
        """
        cache_key = f"{cls.TOKEN_PREFIX}{token}"

        # Отримуємо дані з Redis
        cached_data = await cache.get(cache_key)

        if not cached_data:
            return False

        try:
            user_id, product_id = map(int, cached_data.split(':'))
        except (ValueError, AttributeError):
            return False

        # Перевіряємо чи співпадають дані
        if user_id != expected_user_id or product_id != expected_product_id:
            return False

        # Видаляємо токен (одноразове використання)
        await cache.delete(cache_key)

        return True

    @classmethod
    async def get_token_data(cls, token: str) -> Optional[str]:
        """
        Отримує дані токену без його видалення

        Returns:
            Строка "user_id:product_id" або None
        """
        cache_key = f"{cls.TOKEN_PREFIX}{token}"
        return await cache.get(cache_key)

    @classmethod
    async def consume_token(cls, token: str) -> None:
        """
        Видаляє токен з кешу (після використання)
        """
        cache_key = f"{cls.TOKEN_PREFIX}{token}"
        await cache.delete(cache_key)
