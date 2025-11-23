"""
Сервіс для роботи з товарів
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import selectinload
from fastapi import BackgroundTasks, HTTPException
import logging
import json

from app.products.models import Product, Category, ProductTranslation
from app.products.translation_service import translation_service
from app.products.schemas import ProductCreate, ProductUpdate, ProductFilter
from app.core.cache import cache

logger = logging.getLogger(__name__)


class ProductService:
    """Сервіс для управління товарами"""

    async def create_product(
        self,
        product_data: ProductCreate,
        db: AsyncSession,
        background_tasks: BackgroundTasks
    ) -> Product:
        """Створення нового товару з автоматичним перекладом"""
        try:
            product = Product(
                price=product_data.price,
                product_type=product_data.product_type,
                main_image_url=product_data.main_image_url,
                gallery_image_urls=product_data.gallery_image_urls or [],
                zip_file_path=product_data.zip_file_path,
                file_size_mb=product_data.file_size_mb,
                compatibility=product_data.compatibility,
                is_on_sale=product_data.is_on_sale,
                sale_price=product_data.sale_price
            )

            if product_data.category_ids:
                categories = await db.execute(
                    select(Category).where(Category.id.in_(product_data.category_ids))
                )
                product.categories = categories.scalars().all()

            db.add(product)
            await db.flush()

            uk_translation = ProductTranslation(
                product_id=product.id,
                language_code='uk',
                title=product_data.title_uk,
                description=product_data.description_uk,
                is_auto_translated=False
            )
            db.add(uk_translation)
            await db.commit()

            background_tasks.add_task(
                self._translate_product_background,
                product.id,
                product_data.title_uk,
                product_data.description_uk
            )

            # 🔥 ОЧИЩЕННЯ КЕШУ: Новий товар змінює списки товарів
            # Видаляємо всі закешовані сторінки каталогів
            await cache.delete_pattern("products_list:*")

            logger.info(f"Створено товар ID: {product.id}")
            return product

        except Exception as e:
            await db.rollback()
            logger.error(f"Помилка створення товару: {str(e)}")
            raise HTTPException(status_code=500, detail="Помилка створення товару")

    async def _translate_product_background(
        self,
        product_id: int,
        title_uk: str,
        description_uk: str
    ):
        from app.core.database import AsyncSessionLocal

        async with AsyncSessionLocal() as db:
            try:
                results = await translation_service.translate_product(
                    product_id=product_id,
                    title_uk=title_uk,
                    description_uk=description_uk,
                    db=db
                )
                successful = sum(1 for success in results.values() if success)
                logger.info(f"Переклад товару {product_id}: успішно {successful}/{len(results)} мов")

                # 🔥 ОЧИЩЕННЯ КЕШУ: Після перекладу оновлюємо кеш товару для всіх мов
                await cache.delete_pattern(f"product:{product_id}:*")
                # І списки, бо там теж є перекладені назви
                await cache.delete_pattern("products_list:*")

            except Exception as e:
                logger.error(f"Помилка фонового перекладу товару {product_id}: {str(e)}")

    async def get_product(
        self,
        product_id: int,
        language_code: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Отримання товару з кешуванням"""

        # 1. Спробувати отримати з кешу
        cache_key = f"product:{product_id}:{language_code}"
        cached_data = await cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        # 2. Якщо немає в кеші - запит до БД
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.translations))
            .options(selectinload(Product.categories).selectinload(Category.translations)) # Важливо підгрузити переклади категорій
            .where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            return None

        translation = product.get_translation(language_code)
        if not translation:
            translation = product.get_translation('uk')
            if not translation:
                # Якщо навіть українського немає (біта база), повертаємо заглушку або None
                return None

        # Формуємо відповідь
        response = {
            "id": product.id,
            "title": translation.title,
            "description": translation.description,
            "price": float(product.price),
            "product_type": product.product_type.value,
            "main_image_url": product.main_image_url,
            "gallery_image_urls": product.gallery_image_urls,
            "zip_file_path": product.zip_file_path,
            "file_size_mb": float(product.file_size_mb),
            "compatibility": product.compatibility,
            "is_on_sale": product.is_on_sale,
            "sale_price": float(product.sale_price) if product.sale_price else None,
            "actual_price": float(product.get_actual_price()),
            "categories": [
                {"id": cat.id,
                 "name": cat.get_translation(language_code).name if cat.get_translation(language_code) else cat.slug,
                 "slug": cat.slug}
                for cat in product.categories
            ],
            "views_count": product.views_count,
            "downloads_count": product.downloads_count,
            "created_at": product.created_at.isoformat() if product.created_at else None
        }

        # 3. Зберегти в кеш (TTL 5 хвилин)
        await cache.set(cache_key, json.dumps(response), ttl=300)

        return response

    async def get_products_list(
        self,
        language_code: str,
        db: AsyncSession,
        filters: Optional[ProductFilter] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Отримання списку товарів з кешуванням"""

        # 1. Формування ключа кешу
        filters_dict = filters.model_dump(exclude_none=True) if filters else {}
        filters_str = json.dumps(filters_dict, sort_keys=True)
        cache_key = f"products_list:{language_code}:{limit}:{offset}:{filters_str}"

        # 2. Перевірка кешу
        cached_data = await cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)

        # 3. Запит до БД (якщо немає в кеші)
        query = select(Product).options(
            selectinload(Product.translations),
            selectinload(Product.categories).selectinload(Category.translations)
        )

        if filters:
            if filters.category_id:
                query = query.join(Product.categories).where(
                    Category.id == filters.category_id
                )
            if filters.product_type:
                query = query.where(Product.product_type == filters.product_type)
            if filters.is_on_sale is not None:
                query = query.where(Product.is_on_sale == filters.is_on_sale)
            if filters.min_price is not None:
                query = query.where(Product.price >= filters.min_price)
            if filters.max_price is not None:
                query = query.where(Product.price <= filters.max_price)

        if filters and filters.sort_by:
            if filters.sort_by == "price_asc":
                query = query.order_by(Product.price.asc())
            elif filters.sort_by == "price_desc":
                query = query.order_by(Product.price.desc())
            elif filters.sort_by == "newest":
                query = query.order_by(Product.created_at.desc())
            elif filters.sort_by == "popular":
                query = query.order_by(Product.downloads_count.desc())
        else:
            query = query.order_by(Product.created_at.desc())

        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        products = result.scalars().unique().all()

        products_list = []
        for product in products:
            translation = product.get_translation(language_code)
            if translation:
                products_list.append({
                    "id": product.id,
                    "title": translation.title,
                    "description": translation.description[:200] + "...",
                    "price": float(product.price),
                    "product_type": product.product_type.value,
                    "main_image_url": product.main_image_url,
                    "is_on_sale": product.is_on_sale,
                    "sale_price": float(product.sale_price) if product.sale_price else None,
                    "actual_price": float(product.get_actual_price()),
                    "categories": [cat.get_translation(language_code).name if cat.get_translation(language_code) else cat.slug for cat in product.categories],
                    "views_count": product.views_count,
                    "file_size_mb": float(product.file_size_mb)
                })

        # Підрахунок загальної кількості (окремим запитом для пагінації)
        # Оптимізація: якщо це перша сторінка і кешу немає, count все одно потрібен
        count_query = select(func.count(Product.id))
        if filters and filters.category_id:
            count_query = count_query.join(Product.categories).where(
                Category.id == filters.category_id
            )

        # Дублюємо фільтри для count_query
        if filters:
            if filters.product_type:
                count_query = count_query.where(Product.product_type == filters.product_type)
            if filters.is_on_sale is not None:
                count_query = count_query.where(Product.is_on_sale == filters.is_on_sale)
            if filters.min_price is not None:
                count_query = count_query.where(Product.price >= filters.min_price)
            if filters.max_price is not None:
                count_query = count_query.where(Product.price <= filters.max_price)

        total_result = await db.execute(count_query)
        total_count = total_result.scalar() or 0

        response = {
            "products": products_list,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "pages": (total_count + limit - 1) // limit
        }

        # 4. Збереження в кеш (TTL 5 хвилин)
        await cache.set(cache_key, json.dumps(response), ttl=300)

        return response

    async def update_product(
        self,
        product_id: int,
        update_data: ProductUpdate,
        db: AsyncSession,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Product:
        """Оновлення товару"""
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.categories))
            .where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        update_fields = update_data.model_dump(exclude_unset=True, exclude={'title_uk', 'description_uk', 'category_ids'})
        for field, value in update_fields.items():
            setattr(product, field, value)

        if update_data.category_ids is not None:
            if update_data.category_ids:
                categories = await db.execute(
                    select(Category).where(Category.id.in_(update_data.category_ids))
                )
                product.categories = categories.scalars().all()
            else:
                product.categories = []

        if update_data.title_uk or update_data.description_uk:
            uk_translation_result = await db.execute(
                select(ProductTranslation).where(
                    and_(
                        ProductTranslation.product_id == product_id,
                        ProductTranslation.language_code == 'uk'
                    )
                )
            )
            uk_trans = uk_translation_result.scalar_one_or_none()

            title_to_translate = ""
            description_to_translate = ""

            if uk_trans:
                if update_data.title_uk:
                    uk_trans.title = update_data.title_uk
                if update_data.description_uk:
                    uk_trans.description = update_data.description_uk

                title_to_translate = uk_trans.title
                description_to_translate = uk_trans.description
            else:
                # Якщо раптом немає укр. перекладу
                uk_trans = ProductTranslation(
                    product_id=product.id,
                    language_code='uk',
                    title=update_data.title_uk or "Без назви",
                    description=update_data.description_uk or "Без опису",
                    is_auto_translated=False
                )
                db.add(uk_trans)
                title_to_translate = uk_trans.title
                description_to_translate = uk_trans.description

            if background_tasks:
                background_tasks.add_task(
                    self._translate_product_background,
                    product_id,
                    title_to_translate,
                    description_to_translate
                )

        await db.commit()
        await db.refresh(product)

        # 🔥 ОЧИЩЕННЯ КЕШУ:
        # 1. Видаляємо кеш цього конкретного товару (для всіх мов)
        await cache.delete_pattern(f"product:{product_id}:*")
        # 2. Видаляємо кеш списків, бо ціна/назва/картинка могли змінитись в каталозі
        await cache.delete_pattern("products_list:*")

        logger.info(f"Оновлено товар ID: {product_id}, кеш очищено")
        return product

    async def delete_product(
        self,
        product_id: int,
        db: AsyncSession
    ) -> bool:
        """Видалення товару"""
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        await db.delete(product)
        await db.commit()

        # 🔥 ОЧИЩЕННЯ КЕШУ
        await cache.delete_pattern(f"product:{product_id}:*")
        await cache.delete_pattern("products_list:*")

        logger.info(f"Видалено товар ID: {product_id}, кеш очищено")
        return True

    async def increment_view_count(
        self,
        product_id: int,
        db: AsyncSession
    ):
        """Збільшення лічильника переглядів"""
        product = await db.get(Product, product_id)
        if product:
            product.views_count += 1
            await db.commit()
            # Примітка: Тут ми НЕ чистимо кеш, бо лічильник переглядів не є критичним
            # для миттєвого відображення, а часті інвалідації "вб'ють" кеш.


product_service = ProductService()