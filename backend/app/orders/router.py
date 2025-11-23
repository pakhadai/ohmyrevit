# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/orders/router.py

import hashlib
import hmac
import logging
from fastapi import APIRouter, Depends, HTTPException, Body, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
# OLD: from datetime import datetime
from datetime import datetime, timezone
from decimal import Decimal

from app.core.database import get_db
from app.orders.models import Order, PromoCode, WebhookProcessed, OrderStatus, OrderItem
from app.subscriptions.models import UserProductAccess, Subscription, SubscriptionStatus, AccessType
from app.products.models import Product, ProductType
from app.users.models import User
from app.users.dependencies import get_current_user
from app.orders.service import OrderService
from app.orders.schemas import CreateOrderRequest, ApplyDiscountRequest, ApplyDiscountResponse, CheckoutResponse
from app.payments.cryptomus import CryptomusClient
from app.core.email import email_service
from app.core.config import settings
from app.referrals.models import ReferralLog, ReferralBonusType
# ДОДАНО: Імпорт сервісу телеграм
from app.core.telegram_service import telegram_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orders"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_order(
        data: CreateOrderRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Створює замовлення та платіжне посилання, або одразу надає доступ,
    якщо сума до сплати дорівнює нулю.
    """
    service = OrderService(db)
    try:
        order = await service.create_order(
            user_id=current_user.id,
            product_ids=data.product_ids,
            promo_code=data.promo_code,
            use_bonus_points=data.use_bonus_points
        )

        if order.final_total <= 0:
            # # # OLD: order.status = OrderStatus.PAID
            # # # OLD: order.paid_at = datetime.utcnow()
            # # # OLD:
            # # # OLD: for item in order.items:
            # # # OLD:     access_exists = await db.execute(
            # # # OLD:         select(UserProductAccess).where(
            # # # OLD:             UserProductAccess.user_id == current_user.id,
            # # # OLD:             UserProductAccess.product_id == item.product_id
            # # # OLD:         )
            # # # OLD:     )
            # # # OLD:     if not access_exists.scalar_one_or_none():
            # # # OLD:         db.add(UserProductAccess(
            # # # OLD:             user_id=current_user.id,
            # # # OLD:             product_id=item.product_id,
            # # # OLD:             access_type=AccessType.PURCHASE
            # # # OLD:         ))
            # # # OLD:
            # # # OLD: if order.promo_code_id:
            # # # OLD:     promo = await db.get(PromoCode, order.promo_code_id)
            # # # OLD:     if promo:
            # # # OLD:         promo.current_uses += 1
            # # # OLD:
            # # # OLD: await db.commit()
            order = await service.process_successful_order(order.id)
            logger.info(f"Order {order.id} was fully covered by discount. Access granted immediately.")
            return CheckoutResponse(
                order_id=order.id,
                payment_url=None,
                amount=0.0
            )

        cryptomus = CryptomusClient()
        payment_data = await cryptomus.create_payment(
            amount=float(order.final_total),
            order_id=str(order.id)
        )
        result = payment_data.get("result", {})
        order.payment_url = result.get("url")
        order.payment_id = result.get("uuid")

        # # # OLD: await db.commit()

        return CheckoutResponse(
            order_id=order.id,
            payment_url=order.payment_url,
            amount=float(order.final_total)
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутрішня помилка сервера при створенні замовлення")


@router.post("/promo/apply", response_model=ApplyDiscountResponse)
async def apply_discount(
        data: ApplyDiscountRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)

    try:
        products_result = await db.execute(
            select(Product).where(Product.id.in_(data.product_ids))
        )
        products = products_result.scalars().all()
        if not products:
            raise ValueError("Товари не знайдено")

        subtotal = sum(p.get_actual_price() for p in products)

        discount_data = await service.calculate_discount(
            subtotal=subtotal,
            user_id=current_user.id,
            promo_code=data.promo_code,
            bonus_points=data.use_bonus_points or 0
        )

        final_total = subtotal - discount_data["discount_amount"]

        # ДОДАНО: Детальне логування успішного застосування знижки
        logger.info(f"Discount applied for user {current_user.id}. "
                    f"Promo: '{data.promo_code}', Bonuses: {data.use_bonus_points}. "
                    f"Subtotal: {subtotal}, Discount: {discount_data['discount_amount']}, Final: {final_total}")

        return ApplyDiscountResponse(
            success=True,
            discount_amount=float(discount_data["discount_amount"]),
            final_total=float(max(final_total, Decimal(0))),
            bonus_points_used=discount_data["bonus_used"]
        )

    except ValueError as e:
        # ДОДАНО: Детальне логування помилки застосування знижки
        logger.warning(f"Failed to apply discount for user {current_user.id}. "
                       f"Promo: '{data.promo_code}', Bonuses: {data.use_bonus_points}. Reason: {e}")

        products_result = await db.execute(select(Product).where(Product.id.in_(data.product_ids)))
        products = products_result.scalars().all()
        subtotal_on_error = sum(p.get_actual_price() for p in products) if products else 0
        return ApplyDiscountResponse(
            success=False,
            final_total=float(subtotal_on_error),
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Error applying discount: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Внутрішня помилка сервера")


async def check_webhook_processed(payment_id: str, db: AsyncSession) -> bool:
    """Перевірка чи вже був оброблений цей webhook"""
    if not payment_id:
        return False
    result = await db.get(WebhookProcessed, payment_id)
    return result is not None


async def mark_webhook_processed(payment_id: str, status: str, db: AsyncSession):
    """Позначити webhook як оброблений"""
    if not await db.get(WebhookProcessed, payment_id):
        webhook_record = WebhookProcessed(
# OLD:             processed_at=datetime.utcnow(),
            processed_at=datetime.now(timezone.utc),
            payment_id=payment_id,
            status=status,
            success=True
        )
        db.add(webhook_record)


@router.post("/webhooks/cryptomus")
async def cryptomus_webhook(
        request: Request,
        data: dict = Body(...),
        db: AsyncSession = Depends(get_db)
):
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Webhook received from {client_ip}, data: {data}")

    payment_id = data.get("uuid") or data.get("payment_id")
    order_id_str = data.get("order_id")
    status = data.get("status")

    if not all([payment_id, order_id_str, status]):
        logger.error(f"Missing required fields in webhook: {data}")
        raise HTTPException(status_code=400, detail="Missing required fields")

    if await check_webhook_processed(payment_id, db):
        logger.info(f"Webhook {payment_id} already processed, skipping")
        return {"status": "already_processed"}

    try:
        is_subscription = order_id_str.startswith("sub_")
        order_id = int(order_id_str.replace("sub_", "")) if is_subscription else int(order_id_str)
    except (ValueError, TypeError):
        logger.error(f"Invalid order_id format: {order_id_str}")
        raise HTTPException(status_code=400, detail="Invalid order_id format")

    try:
        # # OLD: async with db.begin():
        if is_subscription:
            subscription = await db.get(Subscription, order_id, options=[selectinload(Subscription.user)])
            if not subscription:
                logger.error(f"Subscription {order_id} not found for webhook.")
                await mark_webhook_processed(payment_id, "error_not_found", db)
                return {"status": "error", "message": "Subscription not found"}

            if status == "paid" and subscription.status != SubscriptionStatus.ACTIVE:
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.payment_id = payment_id
                products_to_grant = await db.execute(
                    select(Product).where(Product.product_type == ProductType.PREMIUM))
                for product in products_to_grant.scalars().all():
                    existing_access_res = await db.execute(
                        select(UserProductAccess).where(UserProductAccess.user_id == subscription.user_id,
                                                        UserProductAccess.product_id == product.id))
                    if not existing_access_res.scalar_one_or_none():
                        db.add(UserProductAccess(user_id=subscription.user_id, product_id=product.id,
                                                    access_type=AccessType.SUBSCRIPTION))
                logger.info(f"Subscription {order_id} activated successfully.")

                # ДОДАНО: Повідомлення про активацію підписки
                try:
                    date_str = subscription.end_date.strftime("%d.%m.%Y")
                    msg = (
                        f"👑 *Premium активовано!*\n\n"
                        f"Ваша підписка успішно оплачена.\n"
                        f"Діє до: {date_str}\n\n"
                        f"Тепер вам доступні всі Premium товари!"
                    )
                    await telegram_service.send_message(subscription.user.telegram_id, msg)
                except Exception as e:
                    logger.error(f"Failed to send sub notification: {e}")

            elif status in ["cancel", "wrong_amount", "fail", "system_fail", "refund"]:
                subscription.status = SubscriptionStatus.CANCELLED
                logger.warning(f"Subscription {order_id} payment failed with status: {status}")

        else:
            order_res = await db.execute(select(Order).where(Order.id == order_id))
            order = order_res.scalar_one()
            if not order:
                logger.error(f"Order {order_id} not found for webhook.")
                await mark_webhook_processed(payment_id, "error_not_found", db)
                return {"status": "error", "message": "Order not found"}

            if status == "paid" and order.status != OrderStatus.PAID:
                order.payment_id = payment_id
                service = OrderService(db)
                # Всередині цієї функції тепер є надсилання повідомлення
                await service.process_successful_order(order.id)


            elif status in ["cancel", "wrong_amount", "fail", "system_fail"]:
                order.status = OrderStatus.FAILED
                user_to_refund = await db.get(User, order.user_id)
                if order.bonus_used > 0 and user_to_refund:
                    user_to_refund.bonus_balance += order.bonus_used
                    logger.info(f"Returned {order.bonus_used} bonus points to user {order.user_id}")
                logger.warning(f"Order {order_id} payment failed with status: {status}")

        await mark_webhook_processed(payment_id, status, db)

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")