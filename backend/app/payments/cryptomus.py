import httpx
import hashlib
import base64
import json
from typing import Dict, Optional
from decimal import Decimal
from app.core.config import settings


class CryptomusClient:
    def __init__(self):
        self.api_key = settings.CRYPTOMUS_API_KEY
        self.merchant_id = settings.CRYPTOMUS_MERCHANT_ID
        self.base_url = "https://api.cryptomus.com/v1"

    def _generate_sign(self, data: dict) -> str:
        """Генерує підпис для запиту"""
        # Сортуємо ключі та створюємо JSON
        # Важливо: ensure_ascii=False та separators, щоб збігалося з тим, як підписує Cryptomus
        sorted_data = json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        # Створюємо підпис
        sign = base64.b64encode(
            hashlib.md5(
                f"{sorted_data}{self.api_key}".encode('utf-8')
            ).digest()
        ).decode('utf-8')
        return sign

    async def create_payment(
            self,
            amount: Decimal,  # ЗМІНЕНО: приймаємо Decimal
            order_id: str,
            currency: str = "USD"
    ) -> Dict:
        """Створює платіж в Cryptomus"""

        # ЗМІНЕНО: Форматуємо Decimal в рядок з 2 знаками після коми
        # Це запобігає науковій нотації (1E-5) та помилкам точності
        amount_str = f"{amount:.2f}"

        data = {
            "amount": amount_str,
            "currency": currency,
            "order_id": order_id,
            "url_return": f"{settings.FRONTEND_URL}/payment/success",
            "url_callback": f"{settings.BACKEND_URL}/api/v1/orders/webhooks/cryptomus",
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

            # Логування помилок для дебагу
            if response.is_error:
                print(f"Cryptomus Error: {response.text}")

            response.raise_for_status()
            return response.json()

    def verify_webhook(self, data: dict, sign: str) -> bool:
        """Перевіряє підпис webhook"""
        # Webhook дані приходять вже як dict, генеруємо підпис для перевірки
        expected_sign = self._generate_sign(data)
        return sign == expected_sign