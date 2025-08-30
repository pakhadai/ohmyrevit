"""
Головний файл FastAPI додатку OhMyRevit
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.core.config import settings
from app.core.database import engine, Base

# Налаштування логування
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Менеджер життєвого циклу додатку
    """
    # Startup
    logger.info("Starting OhMyRevit application...")

    # Створення таблиць (для розробки, в продакшені використовуємо Alembic)
    if settings.ENVIRONMENT == "development":
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down OhMyRevit application...")
    await engine.dispose()
    logger.info("Application shutdown complete")


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

# Тут будуть підключатися роутери
# from app.users.router import router as users_router
# from app.products.router import router as products_router
# from app.orders.router import router as orders_router

# app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
# app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
# app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])