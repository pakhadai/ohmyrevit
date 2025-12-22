from typing import Optional, List
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
import logging

from app.orders.models import Order, OrderItem, PromoCode, DiscountType, OrderStatus
from app.products.models import Product
from app.users.models import User
from app.core.config import settings
from app.subscriptions.models import UserProductAccess, AccessType
from app.referrals.models import ReferralLog, ReferralBonusType
from app.wallet.models import Transaction, TransactionType
from app.core.telegram_service import telegram_service
from app.core.translations import get_text

logger = logging.getLogger(__name__)

COINS_PER_USD = settings.COINS_PER_USD


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def usd_to_coins(self, usd_amount: Decimal) -> int:
        return int(usd_amount * COINS_PER_USD)

    def coins_to_usd(self, coins: int) -> Decimal:
        return Decimal(coins) / COINS_PER_USD

    async def calculate_discount(
            self,
            subtotal_coins: int,
            user_id: int,
            promo_code: Optional[str],
            language_code: str = "uk"
    ) -> dict:
        discount_coins = 0
        promo_code_id = None

        if promo_code:
            result = await self.db.execute(
                select(PromoCode).where(
                    PromoCode.code == promo_code,
                    PromoCode.is_active == True
                )
            )
            promo = result.scalar_one_or_none()

            if not promo:
                raise ValueError(get_text("order_error_invalid_promo", language_code))

            if promo.expires_at and promo.expires_at < datetime.now(timezone.utc):
                raise ValueError(get_text("order_error_promo_expired", language_code))

            if promo.max_uses and promo.current_uses >= promo.max_uses:
                raise ValueError(get_text("order_error_promo_max_uses", language_code))

            if promo.discount_type == DiscountType.PERCENTAGE:
                discount_coins = int(subtotal_coins * promo.value / 100)
            else:
                discount_coins = self.usd_to_coins(Decimal(str(promo.value)))

            promo_code_id = promo.id

        return {
            "discount_coins": discount_coins,
            "promo_code_id": promo_code_id
        }

    async def check_user_balance(self, user_id: int, required_coins: int) -> tuple[bool, int]:
        user = await self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        return user.balance >= required_coins, user.balance

    async def create_order(
            self,
            user_id: int,
            product_ids: List[int],
            promo_code: Optional[str] = None,
            language_code: str = "uk"
    ) -> dict:
        user_query = select(User).where(User.id == user_id).with_for_update()
        user_res = await self.db.execute(user_query)
        user = user_res.scalar_one_or_none()

        if not user:
            raise ValueError(get_text("order_error_user_not_found", language_code))

        products_result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = list(products_result.scalars().all())

        if not products:
            raise ValueError(get_text("order_error_products_not_found", language_code))

        product_ids_list = [p.id for p in products]
        existing_access_query = (
            select(UserProductAccess)
            .where(
                UserProductAccess.user_id == user_id,
                UserProductAccess.product_id.in_(product_ids_list)
            )
            .with_for_update()
        )
        existing_access_result = await self.db.execute(existing_access_query)
        existing_access = existing_access_result.scalars().all()

        if existing_access:
            existing_product_ids = {a.product_id for a in existing_access}
            existing_products = [p for p in products if p.id in existing_product_ids]
            product_names = []
            for p in existing_products:
                translation = p.get_translation(language_code)
                product_names.append(translation.title if translation else f"Product #{p.id}")
            raise ValueError(f"Ви вже маєте доступ до: {', '.join(product_names)}")

        subtotal_usd = sum(p.get_actual_price() for p in products)
        subtotal_coins = self.usd_to_coins(subtotal_usd)

        if subtotal_coins == 0:
            order = await self._create_free_order(user_id, products)
            return {
                "order": order,
                "coins_spent": 0,
                "new_balance": user.balance
            }

        discount_data = await self.calculate_discount(
            subtotal_coins, user_id, promo_code, language_code
        )

        final_coins = subtotal_coins - discount_data["discount_coins"]
        final_coins = max(final_coins, 0)

        if user.balance < final_coins:
            raise ValueError(
                f"INSUFFICIENT_FUNDS|{final_coins}|{user.balance}|{final_coins - user.balance}"
            )

        user.balance -= final_coins
        new_balance = user.balance

        order = Order(
            user_id=user_id,
            subtotal=subtotal_usd,
            discount_amount=self.coins_to_usd(discount_data["discount_coins"]),
            final_total=self.coins_to_usd(final_coins),
            status=OrderStatus.PAID,
            promo_code_id=discount_data["promo_code_id"],
            paid_at=datetime.now(timezone.utc)
        )

        for product in products:
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    price_at_purchase=product.get_actual_price()
                )
            )

        self.db.add(order)
        await self.db.flush()

        product_names = []
        for p in products:
            t = p.get_translation(language_code)
            product_names.append(t.title if t else f"#{p.id}")

        description = f"Покупка: {', '.join(product_names)}"
        if len(description) > 450:
            description = description[:450] + "..."

        transaction = Transaction(
            user_id=user_id,
            type=TransactionType.PURCHASE,
            amount=-final_coins,
            balance_after=new_balance,
            description=description,
            order_id=order.id
        )
        self.db.add(transaction)

        for product in products:
            self.db.add(UserProductAccess(
                user_id=user_id,
                product_id=product.id,
                access_type=AccessType.PURCHASE
            ))

        if discount_data["promo_code_id"]:
            promo = await self.db.get(PromoCode, discount_data["promo_code_id"])
            if promo:
                promo.current_uses += 1

        await self.db.commit()
        await self.db.refresh(order)

        try:
            await self._process_referral_bonus(user, final_coins, order.id, language_code)
        except Exception as e:
            logger.error(f"Failed to process referral bonus: {e}")

        try:
            await self._send_purchase_notification(user, products, final_coins, new_balance, language_code)
        except Exception as e:
            logger.error(f"Failed to send purchase notification: {e}")

        logger.info(
            f"Order {order.id} created and paid: user={user_id}, "
            f"coins={final_coins}, balance={new_balance}"
        )

        return {
            "order": order,
            "coins_spent": final_coins,
            "new_balance": new_balance
        }

    async def _create_free_order(self, user_id: int, products: List[Product]) -> Order:
        order = Order(
            user_id=user_id,
            subtotal=Decimal("0.00"),
            discount_amount=Decimal("0.00"),
            final_total=Decimal("0.00"),
            status=OrderStatus.PAID,
            paid_at=datetime.now(timezone.utc)
        )

        for product in products:
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    price_at_purchase=Decimal("0.00")
                )
            )
            self.db.add(UserProductAccess(
                user_id=user_id,
                product_id=product.id,
                access_type=AccessType.PURCHASE
            ))

        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def _process_referral_bonus(
            self,
            buyer: User,
            coins_spent: int,
            order_id: int,
            language_code: str
    ):
        if not buyer.referrer_id:
            return

        referrer_query = select(User).where(User.id == buyer.referrer_id).with_for_update()
        referrer_res = await self.db.execute(referrer_query)
        referrer = referrer_res.scalar_one_or_none()

        if not referrer:
            return

        bonus_coins = int(coins_spent * settings.REFERRAL_PURCHASE_PERCENT)
        if bonus_coins <= 0:
            return

        referrer.balance += bonus_coins

        transaction = Transaction(
            user_id=referrer.id,
            type=TransactionType.REFERRAL,
            amount=bonus_coins,
            balance_after=referrer.balance,
            description=f"Реферальний бонус за покупку {buyer.first_name}",
            order_id=order_id
        )
        self.db.add(transaction)

        referral_log = ReferralLog(
            referrer_id=referrer.id,
            referred_user_id=buyer.id,
            bonus_type=ReferralBonusType.PURCHASE,
            bonus_amount=bonus_coins
        )
        self.db.add(referral_log)

        await self.db.commit()

        try:
            await telegram_service.send_message(
                referrer.telegram_id,
                f"🎁 Ви отримали {bonus_coins} OMR Coins за покупку вашого реферала {buyer.first_name}!"
            )
        except Exception as e:
            logger.error(f"Failed to notify referrer: {e}")

    async def _send_purchase_notification(
            self,
            user: User,
            products: List[Product],
            coins_spent: int,
            new_balance: int,
            language_code: str
    ):
        product_names = []
        for p in products:
            t = p.get_translation(language_code)
            product_names.append(t.title if t else f"#{p.id}")

        message = (
            f"✅ Покупка успішна!\n\n"
            f"📦 Товари: {', '.join(product_names)}\n"
            f"💰 Списано: {coins_spent} OMR Coins\n"
            f"💵 Залишок: {new_balance} монет\n\n"
            f"Перейдіть в розділ 'Мої покупки' для завантаження."
        )
        await telegram_service.send_message(user.telegram_id, message)

    async def process_successful_order(self, order_id: int) -> Order:
        order_res = await self.db.execute(
            select(Order).options(
                selectinload(Order.user).selectinload(User.referrer),
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.translations)
            ).where(Order.id == order_id)
        )
        order = order_res.unique().scalar_one_or_none()

        if not order:
            logger.error(f"Attempted to process non-existent order with ID {order_id}")
            raise ValueError(f"Order with ID {order_id} not found.")

        if order.status == OrderStatus.PAID:
            logger.warning(f"Order {order.id} is already marked as paid.")
            return order

        order.status = OrderStatus.PAID
        order.paid_at = datetime.now(timezone.utc)

        for item in order.items:
            access_exists_res = await self.db.execute(
                select(UserProductAccess).where(
                    UserProductAccess.user_id == order.user_id,
                    UserProductAccess.product_id == item.product_id
                )
            )
            if not access_exists_res.scalar_one_or_none():
                self.db.add(UserProductAccess(
                    user_id=order.user_id,
                    product_id=item.product_id,
                    access_type=AccessType.PURCHASE
                ))

        if order.promo_code_id:
            promo = await self.db.get(PromoCode, order.promo_code_id)
            if promo:
                promo.current_uses += 1

        await self.db.commit()
        await self.db.refresh(order)
        return order