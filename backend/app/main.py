import asyncio
import logging
from contextlib import asynccontextmanager

import httpx
import sentry_sdk
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sentry_sdk.integrations.fastapi import FastApiIntegration

from app.admin.router import router as admin_main_router
from app.bot.router import router as bot_webhook_router
from app.collections.router import router as collections_router
from app.core.config import settings
from app.core.database import engine
from app.core.scheduler import run_subscription_expiration_check
from app.core.translations import get_text
from app.orders.router import router as orders_router
from app.products.router import router as products_router, admin_router as products_admin_router
from app.profile.router import router as profile_router
from app.subscriptions.router import router as subscriptions_router
from app.users.router import auth_router

logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if settings.ENVIRONMENT == "production":
    if not settings.SENTRY_DSN:
        raise ValueError("SENTRY_DSN is required in production environment")

    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
        ],
        traces_sample_rate=0.1,
        environment=settings.ENVIRONMENT,
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(get_text("main_startup_log", "uk"))

    if settings.TELEGRAM_BOT_TOKEN and settings.BACKEND_URL:
        webhook_url = f"{settings.BACKEND_URL}/webhook/{settings.TELEGRAM_BOT_TOKEN}"
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/setWebhook",
                    json={"url": webhook_url, "drop_pending_updates": False}
                )
                if resp.status_code == 200:
                    logger.info(f"Telegram Webhook set to: {webhook_url}")
                else:
                    logger.error(f"Failed to set webhook: {resp.text}")
        except Exception as e:
            logger.error(f"Error setting webhook: {e}")

    scheduler_task = asyncio.create_task(run_subscription_expiration_check())

    yield

    logger.info(get_text("main_shutdown_log", "uk"))
    scheduler_task.cancel()
    await engine.dispose()

is_dev = settings.ENVIRONMENT == "development"

app = FastAPI(
    title=get_text("main_app_title", "uk"),
    description=get_text("main_app_description", "uk"),
    version="1.0.0",
    docs_url="/api/docs" if is_dev else None,
    redoc_url="/api/redoc" if is_dev else None,
    lifespan=lifespan
)

origins = []
if settings.ALLOWED_ORIGINS:
    origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(',')]
elif settings.ENVIRONMENT == "development":
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_PATH), name="uploads")

@app.get("/")
async def root():
    return {
        "message": get_text("main_root_message", "uk"),
        "version": "1.0.0",
        "status": "ok"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy"
    }

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(products_router, prefix="/products")
api_v1_router.include_router(orders_router, prefix="/orders")
api_v1_router.include_router(profile_router, prefix="/profile")
api_v1_router.include_router(subscriptions_router, prefix="/subscriptions")
api_v1_router.include_router(collections_router, prefix="/profile")

admin_router_v1 = APIRouter()
admin_router_v1.include_router(admin_main_router)
admin_router_v1.include_router(products_admin_router, prefix="/products")

app.include_router(api_v1_router)
app.include_router(admin_router_v1, prefix="/api/v1/admin")
app.include_router(bot_webhook_router)