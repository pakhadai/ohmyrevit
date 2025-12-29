from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime

from app.creators.models import CreatorApplication, CreatorApplicationStatus, CreatorPayout, CreatorTransaction
from app.users.models import User
from app.products.models import Product, ModerationStatus
from app.orders.models import Order
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class CreatorService:
    """Сервіс для роботи з креаторами"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_application(self, user_id: int, portfolio_url: Optional[str], motivation: Optional[str]) -> CreatorApplication:
        """Створити заявку на статус креатора"""
        # Перевірка чи користувач вже креатор
        user = await self.db.get(User, user_id)
        if user and user.is_creator:
            raise ValueError("User is already a creator")

        # Перевірка чи є активна заявка
        existing = await self.db.execute(
            select(CreatorApplication)
            .where(
                and_(
                    CreatorApplication.user_id == user_id,
                    CreatorApplication.status == CreatorApplicationStatus.PENDING
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("You already have a pending application")

        # Створюємо заявку
        application = CreatorApplication(
            user_id=user_id,
            portfolio_url=portfolio_url,
            motivation=motivation,
            status=CreatorApplicationStatus.PENDING
        )
        self.db.add(application)
        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def get_user_application(self, user_id: int) -> Optional[CreatorApplication]:
        """Отримати останню заявку користувача"""
        result = await self.db.execute(
            select(CreatorApplication)
            .where(CreatorApplication.user_id == user_id)
            .order_by(CreatorApplication.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def get_creator_status(self, user_id: int) -> dict:
        """Отримати статус креатора"""
        user = await self.db.get(User, user_id)
        application = await self.get_user_application(user_id)

        has_pending = False
        if application and application.status == CreatorApplicationStatus.PENDING:
            has_pending = True

        return {
            "is_creator": user.is_creator if user else False,
            "has_pending_application": has_pending,
            "application": application,
            "creator_balance": user.creator_balance if user else 0
        }

    async def get_creator_balance_info(self, user_id: int) -> dict:
        """Отримати детальну інформацію про баланс креатора"""
        user = await self.db.get(User, user_id)
        if not user or not user.is_creator:
            raise ValueError("User is not a creator")

        # Підрахунок продажів
        sales_result = await self.db.execute(
            select(func.count(CreatorTransaction.id), func.sum(CreatorTransaction.amount_coins))
            .where(
                and_(
                    CreatorTransaction.creator_id == user_id,
                    CreatorTransaction.transaction_type == 'sale'
                )
            )
        )
        total_sales, total_earned = sales_result.one()

        # Товари на модерації (потенційний дохід)
        pending_result = await self.db.execute(
            select(func.count(Product.id))
            .where(
                and_(
                    Product.author_id == user_id,
                    Product.moderation_status == ModerationStatus.PENDING
                )
            )
        )
        pending_products = pending_result.scalar() or 0

        return {
            "balance_coins": user.creator_balance,
            "balance_usd": user.creator_balance / settings.COINS_PER_USD,
            "total_sales": total_sales or 0,
            "total_earned_coins": total_earned or 0,
            "pending_coins": 0  # TODO: підрахувати потенційний дохід з товарів на модерації
        }

    async def request_payout(
        self,
        user_id: int,
        amount_coins: int,
        usdt_address: str,
        usdt_network: str
    ) -> CreatorPayout:
        """Створити запит на виплату"""
        user = await self.db.get(User, user_id)
        if not user or not user.is_creator:
            raise ValueError("User is not a creator")

        # Перевірка мінімальної суми
        min_amount = settings.MIN_PAYOUT_AMOUNT_USD * settings.COINS_PER_USD
        if amount_coins < min_amount:
            raise ValueError(f"Minimum payout amount is {min_amount} coins (${settings.MIN_PAYOUT_AMOUNT_USD})")

        # Перевірка балансу
        if user.creator_balance < amount_coins:
            raise ValueError(f"Insufficient balance. You have {user.creator_balance} coins")

        # Валідація мережі
        valid_networks = ["TRC20", "ERC20", "BEP20"]
        if usdt_network.upper() not in valid_networks:
            raise ValueError(f"Invalid network. Must be one of: {', '.join(valid_networks)}")

        # Створюємо запит виплати
        payout = CreatorPayout(
            creator_id=user_id,
            amount_coins=amount_coins,
            amount_usd=int((amount_coins / settings.COINS_PER_USD) * 100),  # В центах
            usdt_address=usdt_address,
            usdt_network=usdt_network.upper(),
            status="pending"
        )
        self.db.add(payout)

        # Створюємо транзакцію
        transaction = CreatorTransaction(
            creator_id=user_id,
            transaction_type="payout",
            amount_coins=-amount_coins,  # Віднімаємо
            description=f"Payout request to {usdt_network.upper()}",
            payout_id=payout.id
        )
        self.db.add(transaction)

        # Зменшуємо баланс креатора
        user.creator_balance -= amount_coins

        await self.db.commit()
        await self.db.refresh(payout)
        return payout

    async def get_creator_transactions(self, user_id: int, limit: int = 50, offset: int = 0) -> List[CreatorTransaction]:
        """Отримати історію транзакцій креатора"""
        result = await self.db.execute(
            select(CreatorTransaction)
            .where(CreatorTransaction.creator_id == user_id)
            .order_by(CreatorTransaction.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def get_creator_product_stats(self, user_id: int) -> dict:
        """Отримати статистику товарів креатора"""
        from datetime import datetime, timedelta

        # Загальна кількість товарів
        total = await self.db.execute(
            select(func.count(Product.id))
            .where(Product.author_id == user_id)
        )

        # За статусами
        draft = await self.db.execute(
            select(func.count(Product.id))
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.DRAFT))
        )
        pending = await self.db.execute(
            select(func.count(Product.id))
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.PENDING))
        )
        approved = await self.db.execute(
            select(func.count(Product.id))
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.APPROVED))
        )
        rejected = await self.db.execute(
            select(func.count(Product.id))
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.REJECTED))
        )

        # Продажі та дохід
        sales_result = await self.db.execute(
            select(func.count(CreatorTransaction.id), func.sum(CreatorTransaction.amount_coins))
            .where(
                and_(
                    CreatorTransaction.creator_id == user_id,
                    CreatorTransaction.transaction_type == 'sale'
                )
            )
        )
        total_sales, total_revenue = sales_result.one()

        # Топ товари за переглядами
        top_products_views = await self.db.execute(
            select(Product.id, Product.title_uk, Product.views_count)
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.APPROVED))
            .order_by(Product.views_count.desc())
            .limit(5)
        )

        # Топ товари за завантаженнями
        top_products_downloads = await self.db.execute(
            select(Product.id, Product.title_uk, Product.downloads_count)
            .where(and_(Product.author_id == user_id, Product.moderation_status == ModerationStatus.APPROVED))
            .order_by(Product.downloads_count.desc())
            .limit(5)
        )

        # Загальна статистика переглядів та завантажень
        stats_result = await self.db.execute(
            select(
                func.sum(Product.views_count),
                func.sum(Product.downloads_count)
            )
            .where(Product.author_id == user_id)
        )
        total_views, total_downloads = stats_result.one()

        return {
            "total_products": total.scalar() or 0,
            "draft_products": draft.scalar() or 0,
            "pending_products": pending.scalar() or 0,
            "approved_products": approved.scalar() or 0,
            "rejected_products": rejected.scalar() or 0,
            "total_sales": total_sales or 0,
            "total_revenue_coins": total_revenue or 0,
            "total_views": total_views or 0,
            "total_downloads": total_downloads or 0,
            "top_products_by_views": [
                {"id": row[0], "title": row[1], "views": row[2] or 0}
                for row in top_products_views.all()
            ],
            "top_products_by_downloads": [
                {"id": row[0], "title": row[1], "downloads": row[2] or 0}
                for row in top_products_downloads.all()
            ]
        }

    # ============ Sales Commission System ============

    async def process_creator_sale(
        self,
        product_id: int,
        order_id: int,
        sale_coins: int
    ) -> Optional[CreatorTransaction]:
        """
        Нараховує комісію креатору за продаж товару.

        Args:
            product_id: ID проданого товару
            order_id: ID замовлення
            sale_coins: Сума продажу в монетах

        Returns:
            CreatorTransaction якщо це був товар креатора, None якщо адмін товар
        """
        # Отримуємо товар з автором
        product = await self.db.get(Product, product_id)
        if not product or not product.author_id:
            # Це адмін товар або товар не знайдено
            logger.info(f"Product {product_id} has no author - admin product")
            return None

        # Перевіряємо чи автор є креатором
        author = await self.db.get(User, product.author_id)
        if not author or not author.is_creator:
            logger.warning(f"Product {product_id} author {product.author_id} is not a creator")
            return None

        # Розраховуємо комісію платформи та дохід креатора
        commission_percent = settings.MARKETPLACE_COMMISSION_PERCENT  # 15%
        platform_commission = int(sale_coins * commission_percent / 100)
        creator_earnings = sale_coins - platform_commission

        # Нараховуємо монети креатору з блокуванням
        query = select(User).where(User.id == product.author_id).with_for_update()
        result = await self.db.execute(query)
        creator = result.scalar_one_or_none()

        if not creator:
            logger.error(f"Creator {product.author_id} not found during sale")
            return None

        creator.creator_balance += creator_earnings

        # Створюємо транзакцію для креатора
        transaction = CreatorTransaction(
            creator_id=product.author_id,
            transaction_type="sale",
            amount_coins=creator_earnings,
            description=f"Продаж товару: {product.title_uk or product.title_en or f'Product #{product.id}'} (Комісія {commission_percent}%)",
            order_id=order_id,
            product_id=product_id
        )
        self.db.add(transaction)

        # Створюємо транзакцію для платформи (комісія)
        platform_transaction = CreatorTransaction(
            creator_id=product.author_id,  # Зберігаємо зв'язок з креатором
            transaction_type="commission",
            amount_coins=-platform_commission,  # Негативна сума = комісія
            description=f"Комісія платформи {commission_percent}% від продажу",
            order_id=order_id,
            product_id=product_id
        )
        self.db.add(platform_transaction)

        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(
            f"Creator sale processed: creator={product.author_id}, "
            f"product={product_id}, sale={sale_coins}, "
            f"earnings={creator_earnings}, commission={platform_commission}"
        )

        return transaction

    # ============ Creator Product Management ============

    async def create_creator_product(
        self,
        creator_id: int,
        product_data: dict
    ):
        """Створює новий товар креатора зі статусом DRAFT"""
        from app.products.models import Product, ModerationStatus, ProductType, ProductTranslation
        from decimal import Decimal

        # Перевірка чи користувач є креатором
        creator = await self.db.get(User, creator_id)
        if not creator or not creator.is_creator:
            raise ValueError("User is not a creator")

        # Валідація ціни
        if product_data.get("price", 0) < 2.0:
            raise ValueError(f"Minimum price is ${settings.MIN_PRODUCT_PRICE_USD}")

        # Створюємо товар
        product = Product(
            author_id=creator_id,
            moderation_status=ModerationStatus.DRAFT,
            product_type=ProductType.PREMIUM,
            price=Decimal(str(product_data["price"])),
            main_image_url=product_data["main_image_url"],
            gallery_image_urls=product_data.get("gallery_image_urls", []),
            zip_file_path=product_data["zip_file_path"],
            file_size_mb=Decimal(str(product_data["file_size_mb"])),
            compatibility=product_data.get("compatibility"),
            is_on_sale=False,
        )

        self.db.add(product)
        await self.db.flush()

        # Додаємо переклад (поки тільки українська)
        translation = ProductTranslation(
            product_id=product.id,
            language_code="uk",
            title=product_data["title_uk"],
            description=product_data["description_uk"]
        )
        self.db.add(translation)

        # Додаємо категорії
        if product_data.get("category_ids"):
            from app.products.models import Category
            for cat_id in product_data["category_ids"]:
                category = await self.db.get(Category, cat_id)
                if category:
                    product.categories.append(category)

        await self.db.commit()
        await self.db.refresh(product)

        logger.info(f"Creator product created: id={product.id}, creator={creator_id}")
        return product

    async def submit_product_for_moderation(self, product_id: int, creator_id: int):
        """Відправляє товар на модерацію"""
        from app.products.models import Product, ModerationStatus

        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        if product.author_id != creator_id:
            raise ValueError("You don't own this product")

        if product.moderation_status not in [ModerationStatus.DRAFT, ModerationStatus.REJECTED]:
            raise ValueError("Product is not in draft or rejected status")

        product.moderation_status = ModerationStatus.PENDING
        product.rejection_reason = None
        await self.db.commit()

        logger.info(f"Product submitted for moderation: id={product_id}")
        return product

    async def get_creator_products(self, creator_id: int, limit: int = 50, offset: int = 0):
        """Отримує список товарів креатора"""
        from app.products.models import Product
        from sqlalchemy.orm import selectinload

        result = await self.db.execute(
            select(Product)
            .where(Product.author_id == creator_id)
            .options(selectinload(Product.translations))
            .order_by(Product.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def update_creator_product(
        self,
        product_id: int,
        creator_id: int,
        update_data: dict
    ):
        """Оновлює товар креатора (тільки якщо DRAFT або REJECTED)"""
        from app.products.models import Product, ModerationStatus, ProductTranslation
        from decimal import Decimal

        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        if product.author_id != creator_id:
            raise ValueError("You don't own this product")

        if product.moderation_status not in [ModerationStatus.DRAFT, ModerationStatus.REJECTED]:
            raise ValueError("Cannot edit product that is pending or approved")

        # Оновлюємо поля товару
        if "price" in update_data:
            if update_data["price"] < 2.0:
                raise ValueError(f"Minimum price is ${settings.MIN_PRODUCT_PRICE_USD}")
            product.price = Decimal(str(update_data["price"]))

        if "main_image_url" in update_data:
            product.main_image_url = update_data["main_image_url"]

        if "gallery_image_urls" in update_data:
            product.gallery_image_urls = update_data["gallery_image_urls"]

        if "zip_file_path" in update_data:
            product.zip_file_path = update_data["zip_file_path"]

        if "file_size_mb" in update_data:
            product.file_size_mb = Decimal(str(update_data["file_size_mb"]))

        if "compatibility" in update_data:
            product.compatibility = update_data["compatibility"]

        # Оновлюємо переклад
        if "title_uk" in update_data or "description_uk" in update_data:
            translation = next((t for t in product.translations if t.language_code == "uk"), None)
            if translation:
                if "title_uk" in update_data:
                    translation.title = update_data["title_uk"]
                if "description_uk" in update_data:
                    translation.description = update_data["description_uk"]

        # Оновлюємо категорії
        if "category_ids" in update_data:
            from app.products.models import Category
            product.categories.clear()
            for cat_id in update_data["category_ids"]:
                category = await self.db.get(Category, cat_id)
                if category:
                    product.categories.append(category)

        await self.db.commit()
        await self.db.refresh(product)

        logger.info(f"Creator product updated: id={product_id}")
        return product

    async def delete_creator_product(self, product_id: int, creator_id: int):
        """Видаляє товар креатора (тільки DRAFT)"""
        from app.products.models import Product, ModerationStatus

        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        if product.author_id != creator_id:
            raise ValueError("You don't own this product")

        if product.moderation_status != ModerationStatus.DRAFT:
            raise ValueError("Can only delete draft products")

        await self.db.delete(product)
        await self.db.commit()

        logger.info(f"Creator product deleted: id={product_id}")
        return True
