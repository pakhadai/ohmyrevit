from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime

from app.creators.models import CreatorApplication, CreatorApplicationStatus, CreatorPayout, CreatorTransaction
from app.users.models import User
from app.products.models import Product, ModerationStatus
from app.core.config import settings


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

        return {
            "total_products": total.scalar() or 0,
            "draft_products": draft.scalar() or 0,
            "pending_products": pending.scalar() or 0,
            "approved_products": approved.scalar() or 0,
            "rejected_products": rejected.scalar() or 0,
            "total_sales": total_sales or 0,
            "total_revenue_coins": total_revenue or 0
        }
