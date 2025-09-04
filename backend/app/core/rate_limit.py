# backend/app/core/rate_limit.py
from fastapi import Request, HTTPException
from collections import defaultdict
from datetime import datetime, timedelta
import asyncio


class RateLimiter:
    def __init__(self, max_requests: int = 100, window: int = 60):
        self.max_requests = max_requests
        self.window = window
        self.requests = defaultdict(list)

    async def check_rate_limit(self, request: Request):
        client_id = request.client.host
        now = datetime.now()

        # Очищаємо старі запити
        self.requests[client_id] = [
            req_time for req_time in self.requests[client_id]
            if req_time > now - timedelta(seconds=self.window)
        ]

        # Перевіряємо ліміт
        if len(self.requests[client_id]) >= self.max_requests:
            raise HTTPException(429, "Too many requests")

        # Додаємо новий запит
        self.requests[client_id].append(now)