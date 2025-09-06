# backend/app/orders/router.py

import hashlib
import hmac
import logging
from fastapi import APIRouter, Depends, HTTPException, Body, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from decimal import Decimal

from app.core.database import get_db
from app.orders.models import Order, PromoCode, WebhookProcessed, OrderStatus, OrderItem
from app.subscriptions.models import UserProductAccess, Subscription, SubscriptionStatus, AccessType
from app.products.models import Product, ProductType
from app.users.models import User
from app.payments.cryptomus import CryptomusClient
from app.core.email import email_service
from app.core.config import settings
# ДОДАНО: Імпорти для реферальної системи
from app.referrals.models import ReferralLog, ReferralBonusType

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orders"])


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
            payment_id=payment_id,
            processed_at=datetime.utcnow(),
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
    """
    Покращена обробка webhook від Cryptomus з повною валідацією та коректними транзакціями.
    """
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
        # ВИПРАВЛЕННЯ: Використовуємо одну атомарну транзакцію
        async with db.begin():
            if is_subscription:
                subscription = await db.get(Subscription, order_id, options=[selectinload(Subscription.user)])
                if not subscription:
                    logger.error(f"Subscription {order_id} not found for webhook.")
                    await mark_webhook_processed(payment_id, "error_not_found", db)
                    # Не кидаємо HTTPException, щоб Cryptomus не повторював запит
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
                elif status in ["cancel", "wrong_amount", "fail", "system_fail", "refund"]:
                    subscription.status = SubscriptionStatus.CANCELLED
                    logger.warning(f"Subscription {order_id} payment failed with status: {status}")

            else:  # Обробка звичайного замовлення
                order = await db.get(Order, order_id, options=[selectinload(Order.user),
                                                               selectinload(Order.items).selectinload(
                                                                   OrderItem.product)])
                if not order:
                    logger.error(f"Order {order_id} not found for webhook.")
                    await mark_webhook_processed(payment_id, "error_not_found", db)
                    return {"status": "error", "message": "Order not found"}

                if status == "paid" and order.status != OrderStatus.PAID:
                    order.status = OrderStatus.PAID
                    order.paid_at = datetime.utcnow()
                    order.payment_id = payment_id

                    for item in order.items:
                        existing_access_res = await db.execute(
                            select(UserProductAccess).where(UserProductAccess.user_id == order.user_id,
                                                            UserProductAccess.product_id == item.product_id))
                        if not existing_access_res.scalar_one_or_none():
                            db.add(UserProductAccess(user_id=order.user_id, product_id=item.product_id,
                                                     access_type=AccessType.PURCHASE))

                    if order.promo_code_id:
                        promo = await db.get(PromoCode, order.promo_code_id)
                        if promo:
                            promo.current_uses += 1

                    # РЕФЕРАЛЬНА ЛОГІКА ДЛЯ ПОКУПОК
                    buyer = order.user
                    if buyer and buyer.referrer_id:
                        referrer = await db.get(User, buyer.referrer_id)
                        if referrer:
                            commission_amount = int(order.final_total * Decimal('0.05') * 100)
                            if commission_amount > 0:
                                referrer.bonus_balance += commission_amount
                                db.add(ReferralLog(
                                    referrer_id=referrer.id,
                                    referred_user_id=buyer.id,
                                    order_id=order.id,
                                    bonus_type=ReferralBonusType.PURCHASE,
                                    bonus_amount=commission_amount,
                                    purchase_amount=order.final_total
                                ))
                                logger.info(
                                    f"🎁 User {referrer.id} received {commission_amount} bonuses for referral purchase from user {buyer.id}")

                    logger.info(f"Order {order_id} paid successfully.")

                elif status in ["cancel", "wrong_amount", "fail", "system_fail"]:
                    order.status = OrderStatus.FAILED
                    if order.bonus_used > 0 and order.user:
                        order.user.bonus_balance += order.bonus_used
                        logger.info(f"Returned {order.bonus_used} bonus points to user {order.user_id}")
                    logger.warning(f"Order {order_id} payment failed with status: {status}")

            await mark_webhook_processed(payment_id, status, db)

        # db.begin() автоматично робить commit при успішному виході
        return {"status": "ok"}
    except Exception as e:
        # db.begin() автоматично робить rollback при виключенні
        logger.error(f"Unexpected error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")