# backend/app/core/cache.py
from functools import wraps
import hashlib
import json
from typing import Optional
import redis.asyncio as redis
from app.core.config import settings

class CacheManager:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL)

    async def get(self, key: str) -> Optional[str]:
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl: int = 300):
        await self.redis.setex(key, ttl, value)

    def cache_result(self, ttl: int = 300):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Генеруємо ключ на основі аргументів
                cache_key = f"{func.__name__}:{hashlib.md5(str(args).encode()).hexdigest()}"

                # Перевіряємо кеш
                cached = await self.get(cache_key)
                if cached:
                    return json.loads(cached)

                # Виконуємо функцію
                result = await func(*args, **kwargs)

                # Зберігаємо в кеш
                await self.set(cache_key, json.dumps(result), ttl)
                return result

            return wrapper

        return decorator


cache = CacheManager()