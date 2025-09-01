"""
API роутери для роботи з товарами
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin
from app.users.models import User
from app.products.service import product_service
from app.products.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    PaginatedProductsResponse,
    ProductFilter,
    CategoryCreate,
    CategoryResponse
)

# Створюємо роутери
router = APIRouter(tags=["Products"])
admin_router = APIRouter(tags=["Admin Products"])


# ========== Публічні ендпоінти ==========

@router.get("", response_model=PaginatedProductsResponse)
async def get_products(
        # Заголовок для визначення мови
        accept_language: Optional[str] = Header(default="uk"),
        # Параметри фільтрації
        category_id: Optional[int] = Query(None, description="ID категорії"),
        product_type: Optional[str] = Query(None, description="Тип товару: free або premium"),
        is_on_sale: Optional[bool] = Query(None, description="Тільки товари зі знижкою"),
        min_price: Optional[float] = Query(None, ge=0, description="Мінімальна ціна"),
        max_price: Optional[float] = Query(None, ge=0, description="Максимальна ціна"),
        sort_by: Optional[str] = Query("newest", description="Сортування: price_asc, price_desc, newest, popular"),
        # Пагінація
        limit: int = Query(20, ge=1, le=100, description="Кількість товарів на сторінку"),
        offset: int = Query(0, ge=0, description="Зсув для пагінації"),
        # База даних
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку товарів з фільтрацією та пагінацією

    Приймає заголовок Accept-Language для визначення мови:
    - uk - українська (за замовчуванням)
    - en - англійська
    - ru - російська
    """
    # Парсимо мову з заголовка
    language_code = _parse_language_header(accept_language)

    # Створюємо об'єкт фільтрів
    filters = ProductFilter(
        category_id=category_id,
        product_type=product_type,
        is_on_sale=is_on_sale,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by
    )

    # Отримуємо товари
    result = await product_service.get_products_list(
        language_code=language_code,
        db=db,
        filters=filters,
        limit=limit,
        offset=offset
    )

    return result


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
        product_id: int,
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db),
        background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    Отримання детальної інформації про товар

    Збільшує лічильник переглядів
    """
    # Парсимо мову
    language_code = _parse_language_header(accept_language)

    # Отримуємо товар
    product = await product_service.get_product(
        product_id=product_id,
        language_code=language_code,
        db=db
    )

    if not product:
        raise HTTPException(status_code=404, detail="Товар не знайдено")

    # Збільшуємо лічильник переглядів у фоні
    background_tasks.add_task(
        product_service.increment_view_count,
        product_id,
        db
    )

    return product


@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
        slug: str,
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання товару за slug (для SEO-friendly URLs)
    """
    # Тут можна додати логіку пошуку за slug
    # Поки що заглушка
    raise HTTPException(status_code=501, detail="Not implemented")


# ========== Адмін ендпоінти ==========

@admin_router.post("", response_model=ProductResponse)
async def create_product(
        product_data: ProductCreate,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    """
    Створення нового товару (тільки для адміністраторів)

    Приймає дані українською мовою.
    Автоматично запускає переклад на інші мови у фоновому режимі.
    """
    product = await product_service.create_product(
        product_data=product_data,
        db=db,
        background_tasks=background_tasks
    )

    # Повертаємо створений товар з українським перекладом
    return await product_service.get_product(
        product_id=product.id,
        language_code="uk",
        db=db
    )


@admin_router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
        product_id: int,
        update_data: ProductUpdate,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    """
    Оновлення товару (тільки для адміністраторів)

    Якщо оновлюється текст - запускає переклад у фоні
    """
    product = await product_service.update_product(
        product_id=product_id,
        update_data=update_data,
        db=db,
        background_tasks=background_tasks
    )

    return await product_service.get_product(
        product_id=product.id,
        language_code="uk",
        db=db
    )


@admin_router.delete("/{product_id}")
async def delete_product(
        product_id: int,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    """
    Видалення товару (тільки для адміністраторів)
    """
    success = await product_service.delete_product(
        product_id=product_id,
        db=db
    )

    return {"success": success, "message": "Товар успішно видалено"}


@admin_router.post("/{product_id}/translations")
async def update_product_translation(
        product_id: int,
        language_code: str = Query(..., regex="^(en|ru)$", description="Код мови: en або ru"),
        title: str = Query(..., min_length=1, max_length=200),
        description: str = Query(..., min_length=1),
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    """
    Ручне оновлення перекладу товару (для корекції автоперекладу)
    """
    from app.products.translation_service import translation_service

    success = await translation_service.update_translation(
        product_id=product_id,
        language_code=language_code,
        title=title,
        description=description,
        db=db
    )

    if not success:
        raise HTTPException(status_code=500, detail="Помилка оновлення перекладу")

    return {"success": True, "message": f"Переклад на {language_code} оновлено"}


# ========== Категорії ==========

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
        db: AsyncSession = Depends(get_db)
):
    """Отримання списку всіх категорій"""
    from sqlalchemy import select
    from app.products.models import Category

    result = await db.execute(select(Category))
    categories = result.scalars().all()

    return categories


@admin_router.post("/categories", response_model=CategoryResponse)
async def create_category(
        category_data: CategoryCreate,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    """Створення нової категорії (тільки для адміністраторів)"""
    from app.products.models import Category

    # Перевіряємо унікальність
    from sqlalchemy import select
    existing = await db.execute(
        select(Category).where(Category.slug == category_data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Категорія з таким slug вже існує")

    category = Category(**category_data.dict())
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return category


# ========== Допоміжні функції ==========

def _parse_language_header(accept_language: str) -> str:
    """
    Парсинг заголовка Accept-Language

    Приклади:
    - "uk" -> "uk"
    - "en-US,en;q=0.9" -> "en"
    - "ru-RU" -> "ru"
    """
    if not accept_language:
        return "uk"

    # Беремо першу мову
    lang = accept_language.split(",")[0].split(";")[0].lower()

    # Відкидаємо регіон (en-US -> en)
    lang = lang.split("-")[0]

    # Перевіряємо підтримувані мови
    supported_languages = ["uk", "en", "ru"]
    if lang not in supported_languages:
        return "uk"  # Fallback

    return lang