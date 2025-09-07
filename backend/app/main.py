# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
"""
Головний файл FastAPI додатку OhMyRevit
"""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
from app.core.config import settings
from app.core.database import engine
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
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle події для ініціалізації додатку"""
    logger.info("Starting up...")
    yield
    logger.info("Shutting down...")
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
    allow_origins=["*"], # Дозволяємо всі джерела для простоти
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_PATH), name="uploads")

@app.get("/")
async def root():
    return {
        "message": "OhMyRevit API is running",
        "version": "1.0.0",
        "status": "ok"
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
from app.admin.router import router as admin_main_router
from app.profile.router import router as profile_router
from app.subscriptions.router import router as subscriptions_router

# Основні роутери API v1
api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(users_router, tags=["Auth"])
api_v1_router.include_router(products_router, prefix="/products", tags=["Products"])
api_v1_router.include_router(orders_router, prefix="/orders", tags=["Orders"])
api_v1_router.include_router(profile_router, prefix="/profile", tags=["Profile"])
api_v1_router.include_router(subscriptions_router, prefix="/subscriptions", tags=["Subscriptions"])

# Адмін-роутери
admin_api_router = APIRouter(prefix="/api/v1/admin")
admin_api_router.include_router(admin_main_router)
admin_api_router.include_router(products_admin_router, prefix="/products")

# Реєструємо всі роутери в додатку
app.include_router(api_v1_router)
app.include_router(admin_api_router)