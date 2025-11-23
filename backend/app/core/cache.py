# backend/app/core/cache.py
from functools import wraps
import hashlib
import json
from typing import Optional
import redis.asyncio as redis
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CacheManager:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get(self, key: str) -> Optional[str]:
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl: int = 300):
        await self.redis.setex(key, ttl, value)

    async def delete(self, key: str):
        """Видаляє конкретний ключ"""
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        """
        Видаляє всі ключі, що відповідають шаблону (наприклад, 'product:1:*').
        Використовує SCAN для безпечного перебору ключів без блокування Redis.
        """
        keys = []
        # scan_iter повертає асинхронний ітератор
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)

        if keys:
            # Видаляємо ключі пачками (bulk delete)
            await self.redis.delete(*keys)
            logger.info(f"🧹 Cache cleared for pattern '{pattern}': {len(keys)} keys removed")

    def cache_result(self, ttl: int = 300):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Генеруємо ключ на основі назви функції та аргументів
                # Сортуємо kwargs для стабільності хешу
                args_str = str(args)
                kwargs_str = json.dumps(kwargs, sort_keys=True)
                cache_key = f"{func.__name__}:{hashlib.md5((args_str + kwargs_str).encode()).hexdigest()}"

                # Перевіряємо кеш
                cached = await self.get(cache_key)
                if cached:
                    return json.loads(cached)

                # Виконуємо функцію
                result = await func(*args, **kwargs)

                # Зберігаємо в кеш
                if result:  # Кешуємо тільки непорожні результати
                    await self.set(cache_key, json.dumps(result), ttl)

                return result

            return wrapper

        return decorator


cache = CacheManager()