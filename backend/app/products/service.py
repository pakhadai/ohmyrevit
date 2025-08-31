"""
Сервіс для роботи з товарами
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from fastapi import BackgroundTasks, HTTPException
import logging

from app.products.models import Product, Category, ProductTranslation
from app.products.translation_service import translation_service
from app.products.schemas import ProductCreate, ProductUpdate, ProductFilter

logger = logging.getLogger(__name__)


class ProductService:
    """Сервіс для управління товарами"""

    async def create_product(
        self,
        product_data: ProductCreate,
        db: AsyncSession,
        background_tasks: BackgroundTasks
    ) -> Product:
        """
        Створення нового товару з автоматичним перекладом

        Args:
            product_data: Дані товару (українською)
            db: Сесія БД
            background_tasks: FastAPI BackgroundTasks для фонових завдань

        Returns:
            Створений товар
        """
        try:
            # Створюємо товар
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

            # Додаємо категорії якщо вказані
            if product_data.category_ids:
                categories = await db.execute(
                    select(Category).where(Category.id.in_(product_data.category_ids))
                )
                product.categories = categories.scalars().all()

            # Зберігаємо товар
            db.add(product)
            await db.flush()  # Отримуємо ID без commit

            # Зберігаємо українську версію тексту
            uk_translation = ProductTranslation(
                product_id=product.id,
                language_code='uk',
                title=product_data.title_uk,
                description=product_data.description_uk,
                is_auto_translated=False
            )
            db.add(uk_translation)
            await db.commit()

            # Запускаємо фонове завдання для перекладу
            background_tasks.add_task(
                self._translate_product_background,
                product.id,
                product_data.title_uk,
                product_data.description_uk
            )

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
        """
        Фонове завдання для перекладу товару

        Це виконується асинхронно після створення товару
        """
        # Створюємо нову сесію для фонового завдання
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

            except Exception as e:
                logger.error(f"Помилка фонового перекладу товару {product_id}: {str(e)}")

    async def get_product(
        self,
        product_id: int,
        language_code: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """
        Отримання товару з перекладом

        Args:
            product_id: ID товару
            language_code: Код мови ('uk', 'en', 'ru')
            db: Сесія БД

        Returns:
            Словник з даними товару та перекладом
        """
        # Завантажуємо товар з усіма перекладами
        result = await db.execute(
            select(Product)
            .options(selectinload(Product.translations))
            .options(selectinload(Product.categories))
            .where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            return None

        # Отримуємо переклад
        translation = product.get_translation(language_code)

        if not translation:
            logger.warning(f"Переклад товару {product_id} для мови {language_code} не знайдено")
            return None

        # Формуємо відповідь
        return {
            "id": product.id,
            "title": translation.title,
            "description": translation.description,
            "price": float(product.price),
            "product_type": product.product_type.value,
            "main_image_url": product.main_image_url,
            "gallery_image_urls": product.gallery_image_urls,
            "file_size_mb": float(product.file_size_mb),
            "compatibility": product.compatibility,
            "is_on_sale": product.is_on_sale,
            "sale_price": float(product.sale_price) if product.sale_price else None,
            "actual_price": float(product.get_actual_price()),
            "categories": [
                {"id": cat.id, "name": cat.name, "slug": cat.slug}
                for cat in product.categories
            ],
            "views_count": product.views_count,
            "downloads_count": product.downloads_count,
            "created_at": product.created_at.isoformat() if product.created_at else None
        }

    async def get_products_list(
        self,
        language_code: str,
        db: AsyncSession,
        filters: Optional[ProductFilter] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Отримання списку товарів з фільтрацією

        Args:
            language_code: Код мови
            db: Сесія БД
            filters: Фільтри для товарів
            limit: Кількість товарів
            offset: Зсув для пагінації

        Returns:
            Словник з товарами та метаданими
        """
        # Базовий запит
        query = select(Product).options(
            selectinload(Product.translations),
            selectinload(Product.categories)
        )

        # Застосовуємо фільтри
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

        # Сортування
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

        # Виконуємо запит з пагінацією
        query = query.limit(limit).offset(offset)
        result = await db.execute(query)
        products = result.scalars().all()

        # Формуємо список товарів з перекладами
        products_list = []
        for product in products:
            translation = product.get_translation(language_code)
            if translation:
                products_list.append({
                    "id": product.id,
                    "title": translation.title,
                    "description": translation.description[:200] + "...",  # Короткий опис
                    "price": float(product.price),
                    "product_type": product.product_type.value,
                    "main_image_url": product.main_image_url,
                    "is_on_sale": product.is_on_sale,
                    "sale_price": float(product.sale_price) if product.sale_price else None,
                    "actual_price": float(product.get_actual_price()),
                    "categories": [cat.name for cat in product.categories],
                    "views_count": product.views_count
                })

        # Рахуємо загальну кількість
        count_query = select(func.count(Product.id))
        if filters and filters.category_id:
            count_query = count_query.join(Product.categories).where(
                Category.id == filters.category_id
            )

        total_result = await db.execute(count_query)
        total_count = total_result.scalar()

        return {
            "products": products_list,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "pages": (total_count + limit - 1) // limit
        }

    async def update_product(
        self,
        product_id: int,
        update_data: ProductUpdate,
        db: AsyncSession,
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Product:
        """
        Оновлення товару

        Args:
            product_id: ID товару
            update_data: Дані для оновлення
            db: Сесія БД
            background_tasks: Для перекладу при оновленні тексту

        Returns:
            Оновлений товар
        """
        # Знаходимо товар
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        # Оновлюємо основні поля
        update_fields = update_data.dict(exclude_unset=True, exclude={'title_uk', 'description_uk', 'category_ids'})
        for field, value in update_fields.items():
            setattr(product, field, value)

        # Оновлюємо категорії якщо вказані
        if update_data.category_ids is not None:
            categories = await db.execute(
                select(Category).where(Category.id.in_(update_data.category_ids))
            )
            product.categories = categories.scalars().all()

        # Якщо оновлюється текст - оновлюємо переклади
        if update_data.title_uk or update_data.description_uk:
            # Знаходимо українську версію
            uk_translation = await db.execute(
                select(ProductTranslation).where(
                    and_(
                        ProductTranslation.product_id == product_id,
                        ProductTranslation.language_code == 'uk'
                    )
                )
            )
            uk_trans = uk_translation.scalar_one_or_none()

            if uk_trans:
                if update_data.title_uk:
                    uk_trans.title = update_data.title_uk
                if update_data.description_uk:
                    uk_trans.description = update_data.description_uk

                # Запускаємо переклад у фоні
                if background_tasks:
                    background_tasks.add_task(
                        self._translate_product_background,
                        product_id,
                        uk_trans.title,
                        uk_trans.description
                    )

        await db.commit()
        await db.refresh(product)

        return product

    async def delete_product(
        self,
        product_id: int,
        db: AsyncSession
    ) -> bool:
        """
        Видалення товару

        Args:
            product_id: ID товару
            db: Сесія БД

        Returns:
            True при успіху
        """
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail="Товар не знайдено")

        await db.delete(product)
        await db.commit()

        logger.info(f"Видалено товар ID: {product_id}")
        return True

    async def increment_view_count(
        self,
        product_id: int,
        db: AsyncSession
    ):
        """
        Збільшення лічильника переглядів

        Args:
            product_id: ID товару
            db: Сесія БД
        """
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()

        if product:
            product.views_count += 1
            await db.commit()


# Додаємо імпорт для func
from sqlalchemy import func


# Створюємо екземпляр сервісу
product_service = ProductService()