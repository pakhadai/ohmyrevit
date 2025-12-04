from fastapi import APIRouter, Depends, HTTPException, Query, Header, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.core.database import get_db
from app.core.auth import require_admin
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
from app.products.models import Category, CategoryTranslation
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

# Створюємо роутери
router = APIRouter()
admin_router = APIRouter()


# ========== Публічні ендпоінти ==========

@router.get("", response_model=PaginatedProductsResponse)
async def get_products(
    accept_language: Optional[str] = Header(default="uk"),
    category_id: Optional[int] = Query(None),
    product_type: Optional[str] = Query(None),
    is_on_sale: Optional[bool] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    sort_by: Optional[str] = Query("newest"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
):
    language_code = _parse_language_header(accept_language)
    filters = ProductFilter(
        category_id=category_id, product_type=product_type, is_on_sale=is_on_sale,
        min_price=min_price, max_price=max_price, sort_by=sort_by
    )
    return await product_service.get_products_list(
        language_code=language_code, db=db, filters=filters, limit=limit, offset=offset
    )

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):
    language_code = _parse_language_header(accept_language)

    result = await db.execute(
        select(Category).options(
            joinedload(Category.translations)
        )
    )
    categories = result.scalars().unique().all()

    response_data = []
    for category in categories:
        translation = next(
            (t for t in category.translations if t.language_code == language_code),
            next((t for t in category.translations if t.language_code == 'uk'), None)
        )
        if translation:
            response_data.append({
                "id": category.id,
                "slug": category.slug,
                "name": translation.name
            })
    return response_data


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    accept_language: Optional[str] = Header(default="uk"),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    language_code = _parse_language_header(accept_language)
    product = await product_service.get_product(product_id=product_id, language_code=language_code, db=db)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не знайдено")
    background_tasks.add_task(product_service.increment_view_count, product_id, db)
    return product


@router.get("/slug/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
        slug: str,
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):
    raise HTTPException(status_code=501, detail="Not implemented")


# ========== Адмін ендпоінти ==========

@admin_router.post("", response_model=ProductResponse)
async def create_product(
        product_data: ProductCreate,
        background_tasks: BackgroundTasks,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    product = await product_service.create_product(
        product_data=product_data,
        db=db,
        background_tasks=background_tasks
    )
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
    success = await product_service.delete_product(
        product_id=product_id,
        db=db
    )
    return {"success": success, "message": "Товар успішно видалено"}


@admin_router.post("/{product_id}/translations")
async def update_product_translation(
        product_id: int,
        language_code: str = Query(..., pattern="^(en|ru|de|es)$", description="Код мови: en, ru, de або es"),
        title: str = Query(..., min_length=1, max_length=200),
        description: str = Query(..., min_length=1),
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
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


# ========== Категорії (Адмін) ==========

@admin_router.post("/categories", response_model=CategoryResponse)
async def create_category(
        category_data: CategoryCreate,
        db: AsyncSession = Depends(get_db),
        admin_user: User = Depends(require_admin)
):
    from app.products.models import Category
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
    if not accept_language:
        return "uk"
    lang = accept_language.split(",")[0].split(";")[0].lower()
    lang = lang.split("-")[0]
    supported_languages = ["uk", "en", "ru", "de", "es"]
    if lang not in supported_languages:
        return "uk"
    return lang