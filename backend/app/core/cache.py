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
        self.redis = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            retry_on_timeout=True,
            socket_keepalive=True
        )

    async def get(self, key: str) -> Optional[str]:
        return await self.redis.get(key)

    async def set(self, key: str, value: str, ttl: int = 300):
        await self.redis.setex(key, ttl, value)

    async def delete(self, key: str):
        await self.redis.delete(key)

    async def delete_pattern(self, pattern: str):
        keys = []
        async for key in self.redis.scan_iter(match=pattern):
            keys.append(key)

        if keys:
            await self.redis.delete(*keys)
            logger.info(f"Cache cleared for pattern '{pattern}': {len(keys)} keys removed")

    def cache_result(self, ttl: int = 300):
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                args_str = str(args)
                kwargs_str = json.dumps(kwargs, sort_keys=True)
                cache_key = f"{func.__name__}:{hashlib.md5((args_str + kwargs_str).encode()).hexdigest()}"

                cached = await self.get(cache_key)
                if cached:
                    return json.loads(cached)

                result = await func(*args, **kwargs)

                if result:
                    await self.set(cache_key, json.dumps(result), ttl)

                return result

            return wrapper

        return decorator

cache = CacheManager()