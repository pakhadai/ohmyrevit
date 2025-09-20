# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
import asyncio
from typing import AsyncGenerator
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

import time

from app.core.config import settings
from app.core.database import Base, get_db
from app.main import app
from app.users.models import User
# OLD: from app.products.models import Product, ProductTranslation
from app.products.models import Product, ProductTranslation, Category, CategoryTranslation
# OLD: from app.orders.models import PromoCode, DiscountType
from app.orders.models import PromoCode, DiscountType
from decimal import Decimal

# Використовуємо окрему тестову базу даних
TEST_DB_NAME = "ohmyrevit_test_db"
TEST_DATABASE_URL = settings.DATABASE_URL.replace(settings.DB_NAME, TEST_DB_NAME)

engine_test = create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)
async_session_maker = async_sessionmaker(engine_test, class_=AsyncSession, expire_on_commit=False)


# # OLD: # OLD: async def override_get_db(session: AsyncSession = pytest.lazy_fixture("db_session")) -> AsyncGenerator[
# # OLD: # OLD:     AsyncSession, None]:
# # OLD: # OLD:     yield session
# # OLD: # OLD:
# # OLD: # OLD:
# # OLD: # OLD: app.dependency_overrides[get_db] = override_get_db

# ДОДАНО: Перевизначаємо фікстуру anyio_backend з областю видимості 'session'
# Це вирішує проблему ScopeMismatch для асинхронних фікстур рівня сесії.
@pytest.fixture(scope='session')
def anyio_backend():
    return 'asyncio'


@pytest.fixture(scope="session")
def event_loop(anyio_backend):
    """Створює event loop для всієї тестової сесії."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session", autouse=True)
async def prepare_database(event_loop):
    service_db_url = settings.DATABASE_URL.replace(f"/{settings.DB_NAME}", "/postgres")
    create_engine = create_async_engine(service_db_url, isolation_level="AUTOCOMMIT")

    async with create_engine.connect() as conn:
        res = await conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{TEST_DB_NAME}'"))
        if res.scalar_one_or_none():
            await conn.execute(text(f"DROP DATABASE {TEST_DB_NAME} WITH (FORCE)"))
        await conn.execute(text(f"CREATE DATABASE {TEST_DB_NAME}"))
    await create_engine.dispose()

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    async with create_engine.connect() as conn:
        await conn.execute(text(f"DROP DATABASE {TEST_DB_NAME} WITH (FORCE)"))
    await create_engine.dispose()


# --- FIXTURES ДЛЯ СТВОРЕННЯ ТЕСТОВИХ ДАНИХ ---

@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine_test.connect() as connection:
        async with connection.begin() as transaction:
            session = AsyncSession(bind=connection, expire_on_commit=False)
            yield session
            await transaction.rollback()


# ОНОВЛЕНА ФІКСТУРА: Тепер вона напряму приймає db_session і підміняє залежність
@pytest.fixture(scope="function")
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Створює тестовий клієнт і підміняє залежність БД на тестову сесію."""

    async def override_get_db_for_test() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db_for_test

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    # Очищуємо підміну після тесту
    del app.dependency_overrides[get_db]


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
        bonus_balance=1000,
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

    p2 = Product(price=Decimal("25.50"), main_image_url="/img.jpg", zip_file_path="/file.zip", file_size_mb=10,
                 is_on_sale=True, sale_price=Decimal("20.00"))
    p2.translations.append(ProductTranslation(language_code='uk', title='Преміум Товар 2 (Знижка)', description='...'))

    p3 = Product(price=Decimal("0.00"), product_type='free', main_image_url="/img.jpg", zip_file_path="/file.zip",
                 file_size_mb=5)
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

@pytest.fixture(scope="function")
async def admin_user(db_session: AsyncSession) -> User:
    user = User(
        telegram_id=999,
        first_name="Admin",
        username="admin_user",
        is_admin=True
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
async def authorized_admin_client(async_client: AsyncClient, admin_user: User) -> AsyncClient:
    auth_data = {
        "id": admin_user.telegram_id,
        "first_name": admin_user.first_name,
        "auth_date": int(time.time()),
        "hash": "test_hash_for_development"
    }
    response = await async_client.post("/api/v1/auth/telegram", json=auth_data)
    response.raise_for_status()
    token = response.json().get("access_token")
    async_client.headers = {"Authorization": f"Bearer {token}"}
    return async_client

@pytest.fixture(scope="function")
async def test_category(db_session: AsyncSession) -> Category:
    category = Category(slug="test-category")
    db_session.add(category)
    await db_session.flush()
    translation = CategoryTranslation(
        category_id=category.id,
        language_code="uk",
        name="Тестова Категорія"
    )
    db_session.add(translation)
    await db_session.commit()
    await db_session.refresh(category)
    return category