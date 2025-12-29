from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Any
from functools import lru_cache
from pydantic import field_validator


class Settings(BaseSettings):
    DATABASE_URL: str
    DB_NAME: str
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    REDIS_URL: str = "redis://localhost:6379"

    SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    TELEGRAM_BOT_TOKEN: str
    TELEGRAM_BOT_USERNAME: str = ""

    DEEPL_API_KEY: Optional[str] = None
    DEEPL_API_FREE: bool = True
    DEEPL_TARGET_LANGUAGES: List[str] = ["EN", "RU", "DE", "ES"]

    # Gumroad Integration
    GUMROAD_WEBHOOK_SECRET: str = ""  # Для верифікації вебхуків
    GUMROAD_STORE_URL: str = "https://ohmyrevit.gumroad.com"  # URL вашого магазину

    RESEND_API_KEY: str = ""
    FROM_EMAIL: str = "noreply@ohmyrevit.pp.ua"

    FRONTEND_URL: str
    BACKEND_URL: str

    SENTRY_DSN: str = ""

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    ALLOWED_ORIGINS: str = ""
    ALLOWED_FILE_EXTENSIONS: List[str] = [".zip", ".rar", ".7z"]

    MAX_UPLOAD_SIZE_MB: int = 100
    UPLOAD_PATH: str = "/app/uploads"

    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    SUPPORTED_LANGUAGES: list = ["uk", "en", "ru", "de", "es"]
    DEFAULT_LANGUAGE: str = "uk"

    # OMR Coins система
    COINS_PER_USD: int = 100  # 100 монет = $1
    SUBSCRIPTION_PRICE_COINS: int = 500  # Ціна підписки в монетах (= $5)

    # Функціональність підписки (можна відключити)
    SUBSCRIPTION_ENABLED: bool = True

    # Marketplace налаштування
    MARKETPLACE_ENABLED: bool = False
    MARKETPLACE_COMMISSION_PERCENT: int = 15  # Комісія платформи
    MIN_PRODUCT_PRICE_COINS: int = 200  # Мінімум $2
    MIN_PAYOUT_AMOUNT_USD: int = 30  # Мінімум $30 для виплати
    MAX_FILE_SIZE_MB_MARKETPLACE: int = 10  # Максимум 10MB для файлів креаторів
    CREATOR_MAX_PENDING_PRODUCTS: int = 3  # Максимум товарів в модерації одночасно

    # Admin notification settings
    ADMIN_EMAIL: str = ""  # Email для отримання адмін-нотифікацій
    ADMIN_TELEGRAM_ID: Optional[int] = None  # Telegram ID для отримання адмін-нотифікацій

    # --- Email Settings (SMTP) ---
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = ""
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    USE_CREDENTIALS: bool = True
    VALIDATE_CERTS: bool = True

    # Legacy (використовується в бонусній системі)
    SUBSCRIPTION_PRICE_USD: float = 5.0
    REFERRAL_PURCHASE_PERCENT: float = 0.05
    DAILY_BONUS_BASE: int = 10
    BONUS_TO_USD_RATE: int = 100
    MAX_BONUS_DISCOUNT_PERCENT: float = 0.5
    REFERRAL_REGISTRATION_BONUS: int = 30

    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE_MB: int = 500

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra='ignore')

    @field_validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        if not v or len(v) < 32:
            raise ValueError('SECRET_KEY must be at least 32 characters long')
        return v

    @field_validator('ALLOWED_ORIGINS')
    def validate_allowed_origins(cls, v, info):
        if info.data.get('ENVIRONMENT') == 'production' and not v:
            raise ValueError('ALLOWED_ORIGINS must be set in production')
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()