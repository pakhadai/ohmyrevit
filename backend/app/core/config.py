"""
Конфігурація додатку з використанням Pydantic Settings
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Any
from functools import lru_cache
from typing import Optional
from pydantic import field_validator

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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Telegram
    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_BOT_USERNAME: str = ""

    # DeepL API
    DEEPL_API_KEY: Optional[str] = None
    DEEPL_API_FREE: bool = True

    # Cryptomus
    CRYPTOMUS_API_KEY: str = ""
    CRYPTOMUS_MERCHANT_ID: str = ""
    CRYPTOMUS_WEBHOOK_SECRET: str = ""
    CRYPTOMUS_API_URL: str = "https://api.cryptomus.com/v1"

    # Resend
    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@ohmyrevit.com"

    # URLs
    FRONTEND_URL: str
    BACKEND_URL: str

    # Sentry
    SENTRY_DSN: str = ""

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = []

    # ВИПРАВЛЕНО: Додано валідатор для коректного парсингу рядка з .env
    @field_validator("ALLOWED_ORIGINS", mode='before')
    @classmethod
    def assemble_allowed_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Files
    MAX_UPLOAD_SIZE_MB: int = 100
    UPLOAD_PATH: str = "/app/uploads"

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Supported languages
    SUPPORTED_LANGUAGES: list = ["uk", "en", "ru"]
    DEFAULT_LANGUAGE: str = "uk"

    # Subscription
    SUBSCRIPTION_PRICE_USD: float = 5.0

    # Bonus system
    DAILY_BONUS_BASE: int = 10
    BONUS_TO_USD_RATE: int = 100  # 100 бонусів = $1
    MAX_BONUS_DISCOUNT_PERCENT: float = 0.5

    # Налаштування для файлів
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 500
    ALLOWED_FILE_EXTENSIONS: list = [".zip", ".rar", ".7z"]

    @field_validator("ALLOWED_FILE_EXTENSIONS", mode="before")
    @classmethod
    def assemble_allowed_file_extensions(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            # розбиваємо рядок по комі та прибираємо пробіли
            return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

@lru_cache()
def get_settings() -> Settings:
    """
    Функція для отримання налаштувань (кешується)
    """
    return Settings()

# Глобальний об'єкт налаштувань
settings = get_settings()