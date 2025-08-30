"""
Конфігурація додатку з використанням Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Основні налаштування додатку
    """
    # Database
    DATABASE_URL: str
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Security
    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24

    # Telegram
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_BOT_USERNAME: str = ""

    # DeepL API
    DEEPL_API_KEY: str = ""
    DEEPL_API_URL: str = "https://api-free.deepl.com/v2/translate"

    # Cryptomus
    CRYPTOMUS_API_KEY: str = ""
    CRYPTOMUS_MERCHANT_ID: str = ""
    CRYPTOMUS_WEBHOOK_SECRET: str = ""
    CRYPTOMUS_API_URL: str = "https://api.cryptomus.com/v1"

    # Resend
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@ohmyrevit.com"

    # Sentry
    SENTRY_DSN: str = ""

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://t.me"
    ]

    # Files
    MAX_UPLOAD_SIZE_MB: int = 100
    UPLOAD_PATH: str = "/app/uploads"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Supported languages
    SUPPORTED_LANGUAGES: List[str] = ["uk", "en", "ru"]
    DEFAULT_LANGUAGE: str = "uk"

    # Subscription
    SUBSCRIPTION_PRICE_USD: float = 5.0

    # Bonus system
    DAILY_BONUS_AMOUNT: int = 10
    BONUS_TO_USD_RATE: int = 100  # 100 бонусів = $1
    MAX_BONUS_DISCOUNT_PERCENT: int = 50

    class Config:
        env_file = ".env"
        case_sensitive = True

        # Парсинг списків з env
        @classmethod
        def parse_env_var(cls, field_name: str, raw_val: str):
            if field_name == 'ALLOWED_ORIGINS':
                return [origin.strip() for origin in raw_val.split(',')]
            return raw_val


@lru_cache()
def get_settings() -> Settings:
    """
    Функція для отримання налаштувань (кешується)
    """
    return Settings()


# Глобальний об'єкт налаштувань
settings = get_settings()