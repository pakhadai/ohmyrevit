import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.users.models import User
from app.products.models import Product, ProductTranslation, Category
from decimal import Decimal


@pytest.mark.anyio
async def test_create_product_by_admin(authorized_admin_client: AsyncClient, db_session: AsyncSession,
                                       test_category: Category):
    """Тест створення нового товару адміністратором."""
    product_data = {
        "title_uk": "Новий Тестовий Товар",
        "description_uk": "Опис нового товару.",
        "price": 99.99,
        "product_type": "premium",
        "main_image_url": "/uploads/images/main.jpg",
        "zip_file_path": "/uploads/archives/file.zip",
        "file_size_mb": 15.5,
        "compatibility": "Revit 2025",
        "category_ids": [test_category.id]
    }
    response = await authorized_admin_client.post("/api/v1/admin/products", json=product_data)

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Новий Тестовий Товар"

    # Перевірка в БД
    product = await db_session.get(Product, data["id"])
    assert product is not None
    assert product.price == Decimal("99.99")
    # Завантажуємо зв'язки після створення
    await db_session.refresh(product, attribute_names=['translations', 'categories'])
    assert len(product.translations) >= 1
    assert product.translations[0].title == "Новий Тестовий Товар"
    assert product.translations[0].language_code == "uk"
    assert len(product.categories) == 1
    assert product.categories[0].id == test_category.id


@pytest.mark.anyio
async def test_create_product_by_user_fails(authorized_client: AsyncClient):
    """Тест: звичайний користувач не може створити товар."""
    product_data = {"title_uk": "Спроба", "description_uk": "...", "price": 10, "main_image_url": "...",
                    "zip_file_path": "...", "file_size_mb": 1}
    response = await authorized_client.post("/api/v1/admin/products", json=product_data)
    assert response.status_code == 403


@pytest.mark.anyio
async def test_get_products_list(async_client: AsyncClient, test_products):
    """Тест отримання списку товарів."""
    response = await async_client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert data["total"] >= 3
    assert len(data["products"]) > 0


@pytest.mark.anyio
async def test_get_single_product(async_client: AsyncClient, db_session: AsyncSession, test_products):
    """Тест отримання одного товару."""
    product_id = test_products[0].id

    # Перевірка лічильника до запиту
    product_before = await db_session.get(Product, product_id)
    views_before = product_before.views_count

    response = await async_client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["title"] == "Преміум Товар 1"

    # Перевірка, що лічильник переглядів збільшився
    await db_session.refresh(product_before)
    assert product_before.views_count == views_before + 1


@pytest.mark.anyio
async def test_update_product_by_admin(authorized_admin_client: AsyncClient, db_session: AsyncSession, test_products):
    """Тест оновлення товару адміністратором."""
    product_to_update = test_products[0]
    update_data = {
        "title_uk": "Оновлена Назва",
        "price": 123.45,
        "is_on_sale": True,
        "sale_price": 99.00
    }
    response = await authorized_admin_client.put(f"/api/v1/admin/products/{product_to_update.id}", json=update_data)
    assert response.status_code == 200

    await db_session.refresh(product_to_update)

    assert product_to_update.price == Decimal("123.45")
    assert product_to_update.is_on_sale is True
    assert product_to_update.sale_price == Decimal("99.00")

    # Перевіряємо, чи оновився переклад
    translation_res = await db_session.execute(
        select(ProductTranslation).where(ProductTranslation.product_id == product_to_update.id,
                                         ProductTranslation.language_code == 'uk')
    )
    uk_translation = translation_res.scalar_one()
    assert uk_translation.title == "Оновлена Назва"


@pytest.mark.anyio
async def test_delete_product_by_admin(authorized_admin_client: AsyncClient, db_session: AsyncSession, test_products):
    """Тест видалення товару адміністратором."""
    product_to_delete = test_products[0]
    response = await authorized_admin_client.delete(f"/api/v1/admin/products/{product_to_delete.id}")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Перевіряємо, що товар видалено з БД
    deleted_product = await db_session.get(Product, product_to_delete.id)
    assert deleted_product is None