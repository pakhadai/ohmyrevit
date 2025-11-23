import time
from fastapi import Request, HTTPException, status
from app.core.cache import cache  # Використовуємо спільний пул Redis з кеш-менеджера


class RateLimiter:
    """
    Rate Limiter, що використовує Redis та алгоритм Sliding Window (через Sorted Sets).
    Це забезпечує точний контроль лімітів у розподіленому середовищі.
    """

    def __init__(self, max_requests: int = 100, window: int = 60):
        self.max_requests = max_requests
        self.window = window

    async def check_rate_limit(self, request: Request):
        # Отримуємо IP клієнта
        # Примітка: Якщо використовується Cloudflare/Nginx, переконайтеся,
        # що uvicorn налаштований з --proxy-headers, щоб host був реальним IP користувача.
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        now = time.time()
        window_start = now - self.window

        # Використовуємо Redis Pipeline для виконання команд атомарно та швидко
        async with cache.redis.pipeline(transaction=True) as pipe:
            # 1. Видаляємо застарілі запити (ті, що вийшли за межі вікна)
            pipe.zremrangebyscore(key, 0, window_start)

            # 2. Отримуємо кількість актуальних запитів у вікні (до додавання поточного)
            pipe.zcard(key)

            # 3. Додаємо поточний запит (timestamp як member і score)
            # Ми додаємо його в будь-якому разі, а рішення приймаємо на основі лічильника з кроку 2.
            pipe.zadd(key, {str(now): now})

            # 4. Оновлюємо час життя ключа (трохи більше за вікно, щоб не засмічувати пам'ять)
            pipe.expire(key, self.window + 10)

            results = await pipe.execute()

        # results[1] містить результат zcard (кількість запитів ПЕРЕД додаванням поточного)
        current_requests_count = results[1]

        if current_requests_count >= self.max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )