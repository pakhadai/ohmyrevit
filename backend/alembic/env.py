"""
Alembic environment script для асинхронних міграцій
"""
import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
import os
import sys
from pathlib import Path

# Додаємо кореневу директорію до sys.path
sys.path.append(str(Path(__file__).parent.parent))

# Імпортуємо Base та всі моделі
from app.core.database import Base
from app.core.config import settings

# ВАЖЛИВО: Імпортуємо всі моделі щоб Alembic їх бачив
from app.users.models import User
from app.products.models import Product, ProductTranslation, Category

# from app.orders.models import Order, OrderItem, PromoCode
# from app.subscriptions.models import Subscription, UserProductAccess

# this is the Alembic Config object
config = context.config

# Встановлюємо URL бази даних з налаштувань
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata для автогенерації
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """
    Виконання міграцій
    """
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Run migrations in 'online' mode using async engine
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    """
    asyncio.run(run_async_migrations())


# Визначаємо режим роботи
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
