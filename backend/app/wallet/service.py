import logging
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.users.models import User
from app.wallet.models import CoinPack, Transaction, TransactionType

logger = logging.getLogger(__name__)


class WalletService:
    """Сервіс для роботи з OMR Coins гаманцем"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============ Balance Operations ============

    async def get_balance(self, user_id: int) -> int:
        """Отримує поточний баланс користувача"""
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        return user.balance

    async def add_coins(
            self,
            user_id: int,
            amount: int,
            transaction_type: TransactionType,
            description: str,
            external_id: Optional[str] = None,
            order_id: Optional[int] = None,
            subscription_id: Optional[int] = None
    ) -> Transaction:
        """
        Додає монети на баланс користувача

        Args:
            user_id: ID користувача
            amount: Кількість монет (позитивне число)
            transaction_type: Тип транзакції
            description: Опис транзакції
            external_id: Зовнішній ID (наприклад, Gumroad sale_id)
            order_id: ID замовлення (якщо пов'язано)
            subscription_id: ID підписки (якщо пов'язано)
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Отримуємо користувача з блокуванням для оновлення
        query = select(User).where(User.id == user_id).with_for_update()
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        # Оновлюємо баланс
        user.balance += amount
        new_balance = user.balance

        # Створюємо транзакцію
        transaction = Transaction(
            user_id=user_id,
            type=transaction_type,
            amount=amount,
            balance_after=new_balance,
            description=description,
            external_id=external_id,
            order_id=order_id,
            subscription_id=subscription_id
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"Added {amount} coins to user {user_id}. New balance: {new_balance}")

        return transaction

    async def deduct_coins(
            self,
            user_id: int,
            amount: int,
            transaction_type: TransactionType,
            description: str,
            order_id: Optional[int] = None,
            subscription_id: Optional[int] = None
    ) -> Transaction:
        """
        Списує монети з балансу користувача

        Args:
            user_id: ID користувача
            amount: Кількість монет для списання (позитивне число)
            transaction_type: Тип транзакції
            description: Опис транзакції
            order_id: ID замовлення (якщо пов'язано)
            subscription_id: ID підписки (якщо пов'язано)

        Raises:
            ValueError: Якщо недостатньо коштів
        """
        if amount <= 0:
            raise ValueError("Amount must be positive")

        # Отримуємо користувача з блокуванням
        query = select(User).where(User.id == user_id).with_for_update()
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise ValueError(f"User {user_id} not found")

        if user.balance < amount:
            raise ValueError(f"Insufficient funds. Balance: {user.balance}, Required: {amount}")

        # Списуємо монети
        user.balance -= amount
        new_balance = user.balance

        # Створюємо транзакцію (сума негативна для списання)
        transaction = Transaction(
            user_id=user_id,
            type=transaction_type,
            amount=-amount,
            balance_after=new_balance,
            description=description,
            order_id=order_id,
            subscription_id=subscription_id
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        logger.info(f"Deducted {amount} coins from user {user_id}. New balance: {new_balance}")

        return transaction

    async def check_balance(self, user_id: int, required_amount: int) -> bool:
        """Перевіряє, чи достатньо монет на балансі"""
        balance = await self.get_balance(user_id)
        return balance >= required_amount

    # ============ CoinPack Operations ============

    async def get_active_coin_packs(self) -> List[CoinPack]:
        """Отримує список активних пакетів монет"""
        query = (
            select(CoinPack)
            .where(CoinPack.is_active == True)
            .order_by(CoinPack.sort_order)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_coin_pack_by_stripe_price_id(self, stripe_price_id: str) -> Optional[CoinPack]:
        """Знаходить пакет монет за Stripe Price ID"""
        query = select(CoinPack).where(CoinPack.stripe_price_id == stripe_price_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_coin_pack_by_id(self, pack_id: int) -> Optional[CoinPack]:
        """Знаходить пакет монет за ID"""
        return await self.db.get(CoinPack, pack_id)

    # ============ Transaction Operations ============

    async def get_user_transactions(
            self,
            user_id: int,
            limit: int = 20,
            offset: int = 0,
            transaction_type: Optional[TransactionType] = None
    ) -> tuple[List[Transaction], int]:
        """
        Отримує історію транзакцій користувача

        Returns:
            Tuple[List[Transaction], int]: Список транзакцій та загальна кількість
        """
        # Базовий запит
        base_query = select(Transaction).where(Transaction.user_id == user_id)

        if transaction_type:
            base_query = base_query.where(Transaction.type == transaction_type)

        # Загальна кількість
        from sqlalchemy import func
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()

        # Отримуємо транзакції з пагінацією
        query = (
            base_query
            .order_by(desc(Transaction.created_at))
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(query)
        transactions = list(result.scalars().all())

        return transactions, total

    async def check_duplicate_transaction(self, external_id: str) -> bool:
        """Перевіряє, чи вже існує транзакція з таким external_id"""
        query = select(Transaction).where(Transaction.external_id == external_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    # ============ Stripe Integration ============

    async def process_stripe_purchase(
            self,
            user_id: int,
            pack_id: int,
            session_id: str,
            amount_cents: int
    ) -> Transaction:
        """
        Обробляє покупку пакету монет через Stripe

        Args:
            user_id: ID користувача
            pack_id: ID пакету монет
            session_id: Stripe session ID (для дедуплікації)
            amount_cents: Сума в центах (для логування)
        """
        # Перевіряємо на дублікат
        if await self.check_duplicate_transaction(session_id):
            logger.warning(f"Duplicate Stripe transaction: {session_id}")
            raise ValueError(f"Transaction {session_id} already processed")

        # Знаходимо пакет
        coin_pack = await self.get_coin_pack_by_id(pack_id)
        if not coin_pack:
            raise ValueError(f"CoinPack with id '{pack_id}' not found")

        # Розраховуємо кількість монет з бонусом
        total_coins = coin_pack.get_total_coins()

        # Нараховуємо монети
        description = f"Поповнення: {coin_pack.name} ({coin_pack.coins_amount}"
        if coin_pack.bonus_percent > 0:
            bonus_coins = total_coins - coin_pack.coins_amount
            description += f" + {bonus_coins} бонусних"
        description += " монет)"

        transaction = await self.add_coins(
            user_id=user_id,
            amount=total_coins,
            transaction_type=TransactionType.DEPOSIT,
            description=description,
            external_id=session_id
        )

        logger.info(
            f"Stripe purchase processed: user={user_id}, "
            f"pack={coin_pack.name}, coins={total_coins}, session={session_id}"
        )

        return transaction


# ============ Admin Operations ============

class WalletAdminService(WalletService):
    """Розширений сервіс з адмін-функціями"""

    async def create_coin_pack(
            self,
            name: str,
            price_usd: float,
            coins_amount: int,
            stripe_price_id: str,
            bonus_percent: int = 0,
            description: Optional[str] = None,
            is_active: bool = True,
            is_featured: bool = False,
            sort_order: int = 0
    ) -> CoinPack:
        """Створює новий пакет монет"""
        coin_pack = CoinPack(
            name=name,
            price_usd=price_usd,
            coins_amount=coins_amount,
            stripe_price_id=stripe_price_id,
            bonus_percent=bonus_percent,
            description=description,
            is_active=is_active,
            is_featured=is_featured,
            sort_order=sort_order
        )

        self.db.add(coin_pack)
        await self.db.commit()
        await self.db.refresh(coin_pack)

        return coin_pack

    async def update_coin_pack(
            self,
            pack_id: int,
            **kwargs
    ) -> Optional[CoinPack]:
        """Оновлює пакет монет"""
        coin_pack = await self.get_coin_pack_by_id(pack_id)
        if not coin_pack:
            return None

        for key, value in kwargs.items():
            if value is not None and hasattr(coin_pack, key):
                setattr(coin_pack, key, value)

        await self.db.commit()
        await self.db.refresh(coin_pack)

        return coin_pack

    async def delete_coin_pack(self, pack_id: int) -> bool:
        """Видаляє пакет монет (м'яке видалення - деактивація)"""
        coin_pack = await self.get_coin_pack_by_id(pack_id)
        if not coin_pack:
            return False

        coin_pack.is_active = False
        await self.db.commit()

        return True

    async def get_all_coin_packs(
            self,
            include_inactive: bool = True
    ) -> List[CoinPack]:
        """Отримує пакети для адмін-панелі"""
        query = select(CoinPack)
        if not include_inactive:
            query = query.where(CoinPack.is_active == True)
        query = query.order_by(CoinPack.sort_order)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def manual_add_coins(
            self,
            user_id: int,
            amount: int,
            reason: str,
            admin_id: int
    ) -> Transaction:
        """Ручне нарахування монет адміністратором"""
        description = f"Ручне нарахування від адміна #{admin_id}: {reason}"

        return await self.add_coins(
            user_id=user_id,
            amount=amount,
            transaction_type=TransactionType.BONUS,
            description=description
        )