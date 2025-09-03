"""
Головний файл FastAPI додатку OhMyRevit
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.core.config import settings
from app.core.database import engine, Base
from app.profile.router import router as profile_router
from app.subscriptions.router import router as subscriptions_router
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration


# Ініціалізуємо Sentry, тільки якщо DSN вказано
if settings.SENTRY_DSN and settings.SENTRY_DSN.strip():
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )

# Налаштування логування
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle події для ініціалізації додатку"""
    # Створюємо таблиці при старті (для розробки)
    # В продакшені використовуйте Alembic міграції
    #async with engine.begin() as conn:
        #await conn.run_sync(Base.metadata.create_all)

    yield

    # Cleanup при зупинці
    await engine.dispose()


# Створення FastAPI додатку
app = FastAPI(
    title="OhMyRevit API",
    description="API для Telegram Mini App маркетплейсу Revit плагінів",
    version="1.0.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Базовий ендпоінт для перевірки
@app.get("/")
async def root():
    return {
        "message": "OhMyRevit API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Ендпоінт для перевірки стану сервісу"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }

# Підключаємо роутери
from app.users.router import router as users_router
from app.products.router import router as products_router, admin_router as products_admin_router
from app.orders.router import router as orders_router
from app.admin.router import router as admin_router

app.include_router(users_router, prefix="/api/v1", tags=["Users & Auth"])
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(admin_router)
app.include_router(products_admin_router, prefix="/api/v1/admin/products", tags=["Admin Products"])
app.include_router(profile_router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(subscriptions_router, prefix="/api/v1/subscriptions", tags=["Subscriptions"])
