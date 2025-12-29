from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime

from app.creators.models import CreatorApplication, CreatorPayout, CreatorTransaction, CreatorApplicationStatus, PayoutStatus
from app.products.models import Product, ModerationStatus
from app.users.models import User


class CreatorAdminService:
    """Сервіс адмін функцій для маркетплейсу"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============ Creator Applications ============

    async def get_pending_applications(self, limit: int = 50, offset: int = 0) -> List[CreatorApplication]:
        """Отримати заявки на розгляді"""
        query = (
            select(CreatorApplication)
            .where(CreatorApplication.status == CreatorApplicationStatus.PENDING)
            .order_by(CreatorApplication.applied_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def approve_application(self, application_id: int, admin_id: int) -> CreatorApplication:
        """Схвалити заявку на статус креатора"""
        # Отримати заявку
        application = await self.db.get(CreatorApplication, application_id)
        if not application:
            raise ValueError("Application not found")

        if application.status != CreatorApplicationStatus.PENDING:
            raise ValueError("Application is not pending")

        # Оновити статус заявки
        application.status = CreatorApplicationStatus.APPROVED
        application.reviewed_by_id = admin_id
        application.reviewed_at = datetime.utcnow()

        # Надати статус креатора користувачу
        user = await self.db.get(User, application.user_id)
        if user:
            user.is_creator = True

        await self.db.commit()
        await self.db.refresh(application)
        return application

    async def reject_application(
        self,
        application_id: int,
        admin_id: int,
        rejection_reason: str
    ) -> CreatorApplication:
        """Відхилити заявку"""
        application = await self.db.get(CreatorApplication, application_id)
        if not application:
            raise ValueError("Application not found")

        if application.status != CreatorApplicationStatus.PENDING:
            raise ValueError("Application is not pending")

        application.status = CreatorApplicationStatus.REJECTED
        application.rejection_reason = rejection_reason
        application.reviewed_by_id = admin_id
        application.reviewed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(application)
        return application

    # ============ Product Moderation ============

    async def get_pending_products(self, limit: int = 50, offset: int = 0) -> List[Product]:
        """Отримати товари на модерації"""
        query = (
            select(Product)
            .where(Product.moderation_status == ModerationStatus.PENDING)
            .order_by(Product.created_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def approve_product(self, product_id: int, admin_id: int) -> Product:
        """Схвалити товар креатора"""
        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        if product.moderation_status != ModerationStatus.PENDING:
            raise ValueError("Product is not pending moderation")

        product.moderation_status = ModerationStatus.APPROVED
        product.moderated_by_id = admin_id
        product.moderated_at = datetime.utcnow()
        product.is_active = True  # Автоматично активувати

        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def reject_product(
        self,
        product_id: int,
        admin_id: int,
        rejection_reason: str
    ) -> Product:
        """Відхилити товар"""
        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        if product.moderation_status != ModerationStatus.PENDING:
            raise ValueError("Product is not pending moderation")

        product.moderation_status = ModerationStatus.REJECTED
        product.rejection_reason = rejection_reason
        product.moderated_by_id = admin_id
        product.moderated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def hide_product(self, product_id: int, admin_id: int, reason: str) -> Product:
        """Приховати товар (порушення правил)"""
        product = await self.db.get(Product, product_id)
        if not product:
            raise ValueError("Product not found")

        product.moderation_status = ModerationStatus.HIDDEN
        product.rejection_reason = reason
        product.moderated_by_id = admin_id
        product.moderated_at = datetime.utcnow()
        product.is_active = False

        await self.db.commit()
        await self.db.refresh(product)
        return product

    # ============ Payouts ============

    async def get_pending_payouts(self, limit: int = 50, offset: int = 0) -> List[CreatorPayout]:
        """Отримати виплати на розгляді"""
        query = (
            select(CreatorPayout)
            .where(CreatorPayout.status == PayoutStatus.PENDING)
            .order_by(CreatorPayout.requested_at.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def approve_payout(self, payout_id: int, transaction_hash: str) -> CreatorPayout:
        """Підтвердити виплату (після відправки USDT)"""
        payout = await self.db.get(CreatorPayout, payout_id)
        if not payout:
            raise ValueError("Payout not found")

        if payout.status != PayoutStatus.PENDING:
            raise ValueError("Payout is not pending")

        payout.status = PayoutStatus.COMPLETED
        payout.transaction_hash = transaction_hash
        payout.processed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(payout)
        return payout

    async def reject_payout(self, payout_id: int, reason: str) -> CreatorPayout:
        """Відхилити виплату та повернути баланс"""
        payout = await self.db.get(CreatorPayout, payout_id)
        if not payout:
            raise ValueError("Payout not found")

        if payout.status != PayoutStatus.PENDING:
            raise ValueError("Payout is not pending")

        # Повернути баланс креатору
        creator = await self.db.get(User, payout.creator_id)
        if creator:
            creator.creator_balance += payout.amount_coins

        # Створити транзакцію повернення
        refund_transaction = CreatorTransaction(
            creator_id=payout.creator_id,
            transaction_type="payout_refund",
            amount_coins=payout.amount_coins,
            description=f"Payout #{payout.id} rejected: {reason}"
        )
        self.db.add(refund_transaction)

        payout.status = PayoutStatus.REJECTED
        payout.processed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(payout)
        return payout

    # ============ Statistics ============

    async def get_creators_list(self, limit: int = 100, offset: int = 0):
        """Список всіх креаторів з статистикою"""
        query = (
            select(User)
            .where(User.is_creator == True)
            .order_by(User.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        creators = result.scalars().all()

        # Додати статистику для кожного
        creators_with_stats = []
        for creator in creators:
            # Кількість товарів
            products_count_query = select(func.count(Product.id)).where(
                Product.author_id == creator.id
            )
            products_result = await self.db.execute(products_count_query)
            total_products = products_result.scalar() or 0

            # Кількість продажів
            sales_count_query = select(func.count(CreatorTransaction.id)).where(
                and_(
                    CreatorTransaction.creator_id == creator.id,
                    CreatorTransaction.transaction_type == "sale"
                )
            )
            sales_result = await self.db.execute(sales_count_query)
            total_sales = sales_result.scalar() or 0

            creators_with_stats.append({
                "id": creator.id,
                "email": creator.email,
                "telegram_id": creator.telegram_id,
                "first_name": creator.first_name,
                "is_creator": creator.is_creator,
                "creator_balance": creator.creator_balance,
                "total_products": total_products,
                "total_sales": total_sales,
                "created_at": creator.created_at
            })

        return creators_with_stats

    async def get_moderation_stats(self):
        """Статистика модерації"""
        # Заявки на розгляді
        pending_apps_query = select(func.count(CreatorApplication.id)).where(
            CreatorApplication.status == CreatorApplicationStatus.PENDING
        )
        pending_apps_result = await self.db.execute(pending_apps_query)
        pending_applications = pending_apps_result.scalar() or 0

        # Товари на модерації
        pending_products_query = select(func.count(Product.id)).where(
            Product.moderation_status == ModerationStatus.PENDING
        )
        pending_products_result = await self.db.execute(pending_products_query)
        pending_products = pending_products_result.scalar() or 0

        # Виплати на розгляді
        pending_payouts_query = select(func.count(CreatorPayout.id)).where(
            CreatorPayout.status == PayoutStatus.PENDING
        )
        pending_payouts_result = await self.db.execute(pending_payouts_query)
        pending_payouts = pending_payouts_result.scalar() or 0

        # Загальна сума очікуваних виплат
        total_pending_amount_query = select(func.sum(CreatorPayout.amount_coins)).where(
            CreatorPayout.status == PayoutStatus.PENDING
        )
        total_pending_result = await self.db.execute(total_pending_amount_query)
        total_pending_amount = total_pending_result.scalar() or 0

        return {
            "pending_applications": pending_applications,
            "pending_products": pending_products,
            "pending_payouts": pending_payouts,
            "total_pending_payout_coins": total_pending_amount,
            "total_pending_payout_usd": total_pending_amount / 100  # 100 coins = $1
        }
