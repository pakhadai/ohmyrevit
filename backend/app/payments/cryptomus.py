import httpx
import hashlib
import base64
import json
from typing import Dict, Optional
from app.core.config import settings


class CryptomusClient:
    def __init__(self):
        # ДІАГНОСТИКА: Цей код коректно використовує налаштування.
        # Проблема в тому, що значення в settings.CRYPTOMUS_API_KEY або settings.CRYPTOMUS_MERCHANT_ID - невірні.
        self.api_key = settings.CRYPTOMUS_API_KEY
        self.merchant_id = settings.CRYPTOMUS_MERCHANT_ID
        self.base_url = "https://api.cryptomus.com/v1"

    def _generate_sign(self, data: dict) -> str:
        """Генерує підпис для запиту"""
        # Сортуємо ключі та створюємо JSON
        sorted_data = json.dumps(data, sort_keys=True, separators=(',', ':'))
        # Створюємо підпис
        sign = base64.b64encode(
            hashlib.md5(
                f"{sorted_data}{self.api_key}".encode()
            ).digest()
        ).decode()
        return sign

    async def create_payment(
            self,
            amount: float,
            order_id: str,
            currency: str = "USD"
    ) -> Dict:
        """Створює платіж в Cryptomus"""

        data = {
            "amount": str(amount),
            "currency": currency,
            "order_id": order_id,
            "url_return": f"{settings.FRONTEND_URL}/payment/success",
            "url_callback": f"{settings.BACKEND_URL}/api/v1/webhooks/cryptomus",
            "is_payment_multiple": False,
            "lifetime": 3600  # 1 година
        }

        headers = {
            "merchant": self.merchant_id,
            "sign": self._generate_sign(data),
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/payment",
                json=data,
                headers=headers
            )
            # ДІАГНОСТИКА: Ось тут виникає помилка, бо response.status_code дорівнює 401.
            # Це означає, що Cryptomus не може авторизувати запит з наданими merchant_id та sign.
            response.raise_for_status()
            return response.json()

    def verify_webhook(self, data: dict, sign: str) -> bool:
        """Перевіряє підпис webhook"""
        expected_sign = self._generate_sign(data)
        return sign == expected_sign