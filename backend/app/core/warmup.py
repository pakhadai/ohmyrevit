# backend/app/core/warmup.py
"""
Прогрів додатку для уникнення холодного старту
"""
import asyncio
import logging
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger(__name__)


async def warmup_database():
    """Прогріває з'єднання з базою даних"""
    try:
        async with engine.connect() as conn:
            # Простий запит для перевірки з'єднання
            result = await conn.execute(text("SELECT 1"))
            result.scalar()
            logger.info("✅ Database connection warmed up")
    except Exception as e:
        logger.error(f"❌ Database warmup failed: {e}")


async def warmup_application():
    """Виконує прогрів всього додатку"""
    logger.info("🔥 Starting application warmup...")

    # Прогріваємо базу даних
    await warmup_database()

    # Можна додати інші прогріви (Redis, зовнішні API)

    logger.info("✅ Application warmup completed")