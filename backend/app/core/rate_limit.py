import time
from fastapi import Request, HTTPException, status
from app.core.cache import cache

class RateLimiter:
    def __init__(self, max_requests: int = 100, window: int = 60):
        self.max_requests = max_requests
        self.window = window

    async def check_rate_limit(self, request: Request):
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        now = time.time()
        window_start = now - self.window

        async with cache.redis.pipeline(transaction=True) as pipe:
            pipe.zremrangebyscore(key, 0, window_start)
            pipe.zcard(key)
            pipe.zadd(key, {str(now): now})
            pipe.expire(key, self.window + 10)
            pipe.zremrangebyrank(key, 0, -(self.max_requests * 2))
            results = await pipe.execute()

        current_requests_count = results[1]

        if current_requests_count >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )