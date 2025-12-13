from typing import Optional, List
from decimal import Decimal, ROUND_HALF_UP
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
from app.core.telegram_service import telegram_service
from app.core.translations import get_text

logger = logging.getLogger(__name__)


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_discount(
            self,
            subtotal: Decimal,
            user_id: int,
            promo_code: Optional[str],
            bonus_points: int,
            language_code: str = "uk"
    ) -> dict:
        discount_amount = Decimal("0.00")
        promo_code_id = None
        bonus_used = 0

        if promo_code and bonus_points > 0:
            raise ValueError(get_text("order_error_one_discount", language_code))

        if promo_code:
            result = await self.db.execute(
                select(PromoCode).where(
                    PromoCode.code == promo_code,
                    PromoCode.is_active == True
                )
            )
            promo = result.scalar_one_or_none()

            if not promo:
                raise ValueError(get_text("order_error_promo_invalid", language_code))

            if promo.expires_at and promo.expires_at.replace(tzinfo=None) < datetime.now(timezone.utc).replace(
                    tzinfo=None):
                raise ValueError(get_text("order_error_promo_expired", language_code))

            if promo.max_uses and promo.current_uses >= promo.max_uses:
                raise ValueError(get_text("order_error_promo_limit", language_code))

            if promo.discount_type == DiscountType.PERCENTAGE:
                raw_discount = subtotal * (promo.value / Decimal("100"))
                discount_amount = raw_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            else:
                discount_amount = min(subtotal, promo.value)

            promo_code_id = promo.id

        elif bonus_points > 0:
            user = await self.db.get(User, user_id)
            if not user:
                raise ValueError(get_text("order_error_user_not_found", language_code))
            if user.bonus_balance < bonus_points:
                raise ValueError(get_text("order_error_insufficient_bonus", language_code))

            max_bonus_percent = Decimal(str(settings.MAX_BONUS_DISCOUNT_PERCENT))
            max_bonus_discount = subtotal * max_bonus_percent

            bonus_rate = Decimal(str(settings.BONUS_TO_USD_RATE))
            bonus_value = Decimal(bonus_points) / bonus_rate

            actual_discount = min(bonus_value, max_bonus_discount)
            discount_amount = actual_discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            bonus_used = int(discount_amount * bonus_rate)

        return {
            "discount_amount": discount_amount,
            "promo_code_id": promo_code_id,
            "bonus_used": bonus_used
        }

    async def create_order(
            self,
            user_id: int,
            product_ids: List[int],
            promo_code: Optional[str] = None,
            use_bonus_points: Optional[int] = None,
            language_code: str = "uk"
    ) -> Order:
        if use_bonus_points and use_bonus_points > 0:
            user_query = select(User).where(User.id == user_id).with_for_update()
            user_res = await self.db.execute(user_query)
            user = user_res.scalar_one_or_none()
            if not user:
                raise ValueError(get_text("order_error_user_not_found", language_code))

            if user.bonus_balance < use_bonus_points:
                raise ValueError(get_text("order_error_insufficient_bonus", language_code))

        products_result = await self.db.execute(
            select(Product).where(Product.id.in_(product_ids))
        )
        products = products_result.scalars().all()

        if not products:
            raise ValueError(get_text("order_error_products_not_found", language_code))

        subtotal = sum(p.get_actual_price() for p in products)

        if subtotal == 0 and not any(p.product_type == 'free' for p in products):
            raise ValueError(get_text("order_error_zero_value", language_code))

        discount_data = await self.calculate_discount(
            subtotal, user_id, promo_code, use_bonus_points or 0, language_code
        )

        final_total = subtotal - discount_data["discount_amount"]
        final_total = max(final_total, Decimal("0.00"))

        order = Order(
            user_id=user_id,
            subtotal=subtotal,
            discount_amount=discount_data["discount_amount"],
            final_total=final_total,
            status=OrderStatus.PENDING,
            promo_code_id=discount_data["promo_code_id"],
            bonus_used=discount_data["bonus_used"]
        )

        for product in products:
            order.items.append(
                OrderItem(
                    product_id=product.id,
                    price_at_purchase=product.get_actual_price()
                )
            )

        self.db.add(order)

        if discount_data["bonus_used"] > 0:
            user = await self.db.get(User, user_id)
            if user:
                user.bonus_balance -= discount_data["bonus_used"]
                self.db.add(user)

        await self.db.commit()
        await self.db.refresh(order)

        return order

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
            logger.warning(f"Order {order.id} is already marked as paid. Skipping processing.")
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

        buyer = order.user
        lang = buyer.language_code if buyer and buyer.language_code else "uk"

        if buyer and buyer.referrer_id:
            referrer_query = select(User).where(User.id == buyer.referrer_id).with_for_update()
            referrer_res = await self.db.execute(referrer_query)
            referrer = referrer_res.scalar_one_or_none()

            if referrer:
                ref_percent = Decimal(str(settings.REFERRAL_PURCHASE_PERCENT))
                commission_amount = int(order.final_total * ref_percent * 100)

                if commission_amount > 0:
                    referrer.bonus_balance += commission_amount
                    self.db.add(ReferralLog(
                        referrer_id=referrer.id,
                        referred_user_id=buyer.id,
                        order_id=order.id,
                        bonus_type=ReferralBonusType.PURCHASE,
                        bonus_amount=commission_amount,
                        purchase_amount=order.final_total
                    ))

        await self.db.commit()

        try:
            items_str = ""
            for item in order.items:
                title = get_text("order_item_default_title", lang)
                if item.product.translations:
                    trans = next((t for t in item.product.translations if t.language_code == lang), None)
                    if not trans:
                        trans = next((t for t in item.product.translations if t.language_code == 'uk'), None)
                    title = trans.title if trans else item.product.translations[0].title
                items_str += f"- {title}\n"

            msg = (
                f"{get_text('order_msg_success_title', lang, order_id=order.id)}\n\n"
                f"{get_text('order_msg_products_label', lang)}\n{items_str}\n"
                f"{get_text('order_msg_total_label', lang, total=order.final_total)}\n\n"
                f"{get_text('order_msg_access_granted', lang)}"
            )
            await telegram_service.send_message(buyer.telegram_id, msg)
        except Exception as e:
            logger.error(f"Failed to send order notification: {e}")

        return order