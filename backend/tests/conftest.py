# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import asyncio
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
# ДОДАНО: Імпорти для створення/видалення тестової БД
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

import time

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.users.models import User
from app.products.models import Product, ProductTranslation
from app.orders.models import PromoCode, DiscountType
from decimal import Decimal

# Використовуємо окрему тестову базу даних
TEST_DB_NAME = "ohmyrevit_test_db"
TEST_DATABASE_URL = settings.DATABASE_URL.replace(settings.DB_NAME, TEST_DB_NAME)

engine_test = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
async_session_maker = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)

# Перевизначаємо залежність get_db для тестів
async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

# OLD: @pytest.fixture(autouse=True, scope="function") # ВИПРАВЛЕНО: Змінено scope на "function" для вирішення помилки ScopeMismatch
# OLD: async def prepare_database():
# OLD:     async with engine_test.begin() as conn:
# OLD:         await conn.run_sync(Base.metadata.create_all)
# OLD:     yield
# OLD:     async with engine_test.begin() as conn:
# OLD:         await conn.run_sync(Base.metadata.drop_all)
@pytest.fixture(autouse=True, scope="session")
async def prepare_database():
    """Створює тестову БД перед запуском сесії та видаляє її після."""
    # Підключаємось до стандартної БД (postgres), щоб створити нову
    service_db_url = settings.DATABASE_URL.replace(settings.DB_NAME, "postgres")
    create_engine = create_async_engine(service_db_url, isolation_level="AUTOCOMMIT")

    async with create_engine.connect() as conn:
        try:
            # Спробуємо видалити БД, якщо вона залишилась з минулого разу
            await conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE)"))
        except ProgrammingError:
            pass # БД не існувала, все ок
        await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    await create_engine.dispose()

    # Тепер, коли БД створена, створюємо в ній таблиці
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield # Тут запускаються тести

    # Після завершення тестів видаляємо тестову БД
    async with create_engine.connect() as conn:
        await conn.execute(text(f"DROP DATABASE IF EXISTS {TEST_DB_NAME} WITH (FORCE)"))
    await create_engine.dispose()


@pytest.fixture(scope="function")
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# --- FIXTURES ДЛЯ СТВОРЕННЯ ТЕСТОВИХ ДАНИХ ---

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    # OLD: async with async_session_maker() as session:
    # OLD:     yield session
    # ВИПРАВЛЕНО: Транзакція для кожного тесту для повної ізоляції
    async with engine_test.begin() as conn:
        session = AsyncSession(conn, expire_on_commit=False)
        yield session
        await session.rollback() # Відкат після кожного тесту


@pytest.fixture(scope="function")
async def referrer_user(db_session: AsyncSession) -> User:
    user = User(
        telegram_id=1001,
        first_name="Referrer",
        username="referrer_user",
        referral_code="REF_CODE_123"
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def referred_user(db_session: AsyncSession, referrer_user: User) -> User:
    user = User(
        telegram_id=1002,
        first_name="Referred",
        username="referred_user",
        bonus_balance=1000, # Даємо бонуси для тестів
        referrer_id=referrer_user.id
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def test_products(db_session: AsyncSession) -> list[Product]:
    p1 = Product(price=Decimal("10.00"), main_image_url="/img.jpg", zip_file_path="/file.zip", file_size_mb=10)
    p1.translations.append(ProductTranslation(language_code='uk', title='Преміум Товар 1', description='...'))

    p2 = Product(price=Decimal("25.50"), main_image_url="/img.jpg", zip_file_path="/file.zip", file_size_mb=10, is_on_sale=True, sale_price=Decimal("20.00"))
    p2.translations.append(ProductTranslation(language_code='uk', title='Преміум Товар 2 (Знижка)', description='...'))

    p3 = Product(price=Decimal("0.00"), product_type='free', main_image_url="/img.jpg", zip_file_path="/file.zip", file_size_mb=5)
    p3.translations.append(ProductTranslation(language_code='uk', title='Безкоштовний Товар 3', description='...'))

    db_session.add_all([p1, p2, p3])
    await db_session.commit()
    await db_session.refresh(p1)
    await db_session.refresh(p2)
    await db_session.refresh(p3)
    return [p1, p2, p3]

@pytest.fixture(scope="function")
async def test_promo_code(db_session: AsyncSession) -> PromoCode:
    promo = PromoCode(
        code="TEST10",
        discount_type=DiscountType.PERCENTAGE,
        value=Decimal("10.00"),
        is_active=True
    )
    db_session.add(promo)
    await db_session.commit()
    await db_session.refresh(promo)
    return promo

@pytest.fixture(scope="function")
async def authorized_client(async_client: AsyncClient, referred_user: User) -> AsyncClient:
    """Створює клієнта, який вже авторизований під referred_user."""
    auth_data = {
        "id": referred_user.telegram_id,
        "first_name": referred_user.first_name,
        "auth_date": int(time.time()),
        "hash": "test_hash_for_development"
    }
    response = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    response.raise_for_status()
    token = response.json().get("access_token")
    async_client.headers = {"Authorization": f"Bearer {token}"}
    return async_client