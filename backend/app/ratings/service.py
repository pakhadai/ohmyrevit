from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional
import logging

from app.ratings.models import ProductRating
from app.products.models import Product
from app.subscriptions.models import UserProductAccess
from app.users.models import User

logger = logging.getLogger(__name__)


class RatingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_user_access(self, user_id: int, product_id: int) -> bool:
        """
        Перевіряє чи має користувач доступ до товару.
        Користувач може ставити оцінку тільки товарам, до яких має доступ.
        Безкоштовні товари (product_type='free') можна оцінювати без перевірки доступу.
        """
        # Перевіряємо чи товар безкоштовний
        product = await self.db.get(Product, product_id)
        if product and product.product_type == 'free':
            return True

        # Для платних товарів перевіряємо доступ
        result = await self.db.execute(
            select(UserProductAccess).where(
                UserProductAccess.user_id == user_id,
                UserProductAccess.product_id == product_id
            )
        )
        access = result.scalar_one_or_none()
        return access is not None

    async def get_user_rating(self, user_id: int, product_id: int) -> Optional[ProductRating]:
        """Отримати рейтинг користувача для конкретного товару"""
        result = await self.db.execute(
            select(ProductRating).where(
                ProductRating.user_id == user_id,
                ProductRating.product_id == product_id
            )
        )
        return result.scalar_one_or_none()

    async def create_or_update_rating(
        self,
        user_id: int,
        product_id: int,
        rating: int
    ) -> ProductRating:
        """
        Створює або оновлює рейтинг користувача для товару.
        Після збереження автоматично перераховує середній рейтинг товару.
        """
        # Перевірка доступу
        has_access = await self.check_user_access(user_id, product_id)
        if not has_access:
            raise ValueError("Ви можете ставити оцінку тільки до товарів, до яких маєте доступ")

        # Перевірка існування товару
        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Товар не знайдено")

        # Отримуємо існуючий рейтинг або створюємо новий
        existing_rating = await self.get_user_rating(user_id, product_id)

        if existing_rating:
            # Оновлюємо існуючий рейтинг
            existing_rating.rating = rating
            rating_obj = existing_rating
            logger.info(f"Updated rating: user={user_id}, product={product_id}, rating={rating}")
        else:
            # Створюємо новий рейтинг
            rating_obj = ProductRating(
                user_id=user_id,
                product_id=product_id,
                rating=rating
            )
            self.db.add(rating_obj)
            logger.info(f"Created rating: user={user_id}, product={product_id}, rating={rating}")

        # Зберігаємо рейтинг
        await self.db.flush()

        # Перераховуємо статистику товару
        await self._update_product_rating_stats(product_id)

        await self.db.commit()
        await self.db.refresh(rating_obj)

        return rating_obj

    async def delete_rating(self, user_id: int, product_id: int) -> bool:
        """Видалити рейтинг користувача"""
        rating = await self.get_user_rating(user_id, product_id)
        if not rating:
            return False

        await self.db.delete(rating)
        await self._update_product_rating_stats(product_id)
        await self.db.commit()

        logger.info(f"Deleted rating: user={user_id}, product={product_id}")
        return True

    async def get_product_rating_stats(self, product_id: int, user_id: Optional[int] = None) -> dict:
        """
        Отримати статистику рейтингів товару.
        Якщо передано user_id, включає рейтинг конкретного користувача.
        """
        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Товар не знайдено")

        stats = {
            "average_rating": float(product.average_rating) if product.average_rating else None,
            "ratings_count": product.ratings_count or 0,
            "user_rating": None
        }

        # Якщо передано user_id, отримуємо рейтинг користувача
        if user_id:
            user_rating = await self.get_user_rating(user_id, product_id)
            if user_rating:
                stats["user_rating"] = user_rating.rating

        return stats

    async def _update_product_rating_stats(self, product_id: int):
        """
        Перераховує середній рейтинг та кількість оцінок для товару.
        Викликається автоматично після створення/оновлення/видалення рейтингу.
        """
        # Отримуємо статистику
        result = await self.db.execute(
            select(
                func.avg(ProductRating.rating).label('avg_rating'),
                func.count(ProductRating.id).label('count')
            ).where(ProductRating.product_id == product_id)
        )
        stats = result.one()

        # Оновлюємо товар
        product = await self.db.get(Product, product_id)
        if product:
            product.average_rating = round(stats.avg_rating, 2) if stats.avg_rating else None
            product.ratings_count = stats.count or 0

            logger.info(
                f"Updated product rating stats: product={product_id}, "
                f"avg={product.average_rating}, count={product.ratings_count}"
            )
