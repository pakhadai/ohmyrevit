# backend/app/orders/router.py

import hashlib
import hmac
import logging
from fastapi import APIRouter, Depends, HTTPException, Body, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.orders.models import Order, PromoCode, WebhookProcessed
from app.subscriptions.models import UserProductAccess, Subscription, SubscriptionStatus, AccessType
from app.products.models import Product, ProductType
from app.users.models import User
from app.payments.cryptomus import CryptomusClient
from app.core.email import email_service
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orders"])

# Таблиця для збереження оброблених webhook
from sqlalchemy import Column, String, DateTime, Boolean
from app.core.database import Base

async def check_webhook_processed(payment_id: str, db: AsyncSession) -> bool:
    """Перевірка чи вже був оброблений цей webhook"""
    if not payment_id:
        return False

    result = await db.execute(
        select(WebhookProcessed).where(WebhookProcessed.payment_id == payment_id)
    )
    return result.scalar_one_or_none() is not None


async def mark_webhook_processed(payment_id: str, status: str, db: AsyncSession):
    """Позначити webhook як оброблений"""
    webhook_record = WebhookProcessed(
        payment_id=payment_id,
        processed_at=datetime.utcnow(),
        status=status,
        success=True
    )
    db.add(webhook_record)
    await db.commit()


@router.post("/webhooks/cryptomus")
async def cryptomus_webhook(
        request: Request,
        data: dict = Body(...),
        db: AsyncSession = Depends(get_db),
        x_signature: str = Header(None, alias="X-Signature"),
        x_webhook_id: str = Header(None, alias="X-Webhook-Id")
):
    """
    Покращена обробка webhook від Cryptomus з повною валідацією
    """

    # Логуємо вхідний запит
    client_ip = request.client.host if request.client else "unknown"
    logger.info(f"Webhook received from {client_ip}, webhook_id: {x_webhook_id}")

    try:
        # 1. Валідація підпису
        if settings.CRYPTOMUS_WEBHOOK_SECRET and x_signature:
            cryptomus = CryptomusClient()

            # Перевіряємо підпис
            if not cryptomus.verify_webhook(data, x_signature):
                logger.warning(f"Invalid webhook signature from {client_ip}, data: {data}")
                raise HTTPException(
                    status_code=400,
                    detail="Invalid signature"
                )
        else:
            # У development режимі можемо пропускати перевірку
            if settings.ENVIRONMENT == "production":
                logger.error("Missing webhook signature in production")
                raise HTTPException(
                    status_code=400,
                    detail="Missing signature"
                )
            else:
                logger.warning("Skipping signature verification in development mode")

        # 2. Отримуємо дані платежу
        payment_id = data.get("uuid") or data.get("payment_id")
        order_id_str = data.get("order_id")
        status = data.get("status")
        amount = data.get("amount")
        currency = data.get("currency")

        # Валідація обов'язкових полів
        if not all([payment_id, order_id_str, status]):
            logger.error(f"Missing required fields in webhook: {data}")
            raise HTTPException(
                status_code=400,
                detail="Missing required fields"
            )

        # 3. Перевірка ідемпотентності - не обробляємо повторно
        if await check_webhook_processed(payment_id, db):
            logger.info(f"Webhook {payment_id} already processed, skipping")
            return {"status": "already_processed"}

        # 4. Знаходимо замовлення
        try:
            # Видаляємо префікс якщо є (наприклад "sub_123" -> "123")
            if order_id_str.startswith("sub_"):
                order_id = int(order_id_str.replace("sub_", ""))
                is_subscription = True
            else:
                order_id = int(order_id_str)
                is_subscription = False
        except (ValueError, TypeError):
            logger.error(f"Invalid order_id format: {order_id_str}")
            raise HTTPException(
                status_code=400,
                detail="Invalid order_id format"
            )

        # 5. Обробка різних статусів платежу
        if is_subscription:
            # Обробка підписки
            result = await db.execute(
                select(Subscription).where(Subscription.id == order_id)
            )
            subscription = result.scalar_one_or_none()

            if not subscription:
                logger.error(f"Subscription {order_id} not found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Subscription {order_id} not found"
                )

            if status == "paid" and subscription.status != SubscriptionStatus.ACTIVE:
                subscription.status = SubscriptionStatus.ACTIVE
                subscription.payment_id = payment_id

                # OLD: # Надаємо доступ до всіх преміум товарів
                # OLD: from app.products.models import Product
                # OLD: products = await db.execute(
                # OLD:     select(Product).where(Product.product_type == "premium")
                # OLD: )
                # OLD:
                # OLD: for product in products.scalars().all():
                # OLD:     # Перевіряємо чи вже є доступ
                # OLD:     existing = await db.execute(
                # OLD:         select(UserProductAccess).where(
                # OLD:             UserProductAccess.user_id == subscription.user_id,
                # OLD:             UserProductAccess.product_id == product.id
                # OLD:         )
                # OLD:     )
                # OLD:     if not existing.scalar_one_or_none():
                # OLD:         access = UserProductAccess(
                # OLD:             user_id=subscription.user_id,
                # OLD:             product_id=product.id,
                # OLD:             access_type="subscription"
                # OLD:         )
                # OLD:         db.add(access)

                # Надаємо постійний доступ до преміум товарів, що вийшли під час дії підписки
                products_to_grant_access = await db.execute(
                    select(Product).where(
                        Product.product_type == ProductType.PREMIUM,
                        Product.created_at >= subscription.start_date,
                        Product.created_at <= subscription.end_date
                    )
                )

                for product in products_to_grant_access.scalars().all():
                    # Перевіряємо, чи вже є доступ, щоб уникнути дублікатів
                    existing_access = await db.execute(
                        select(UserProductAccess).where(
                            UserProductAccess.user_id == subscription.user_id,
                            UserProductAccess.product_id == product.id
                        )
                    )
                    if not existing_access.scalar_one_or_none():
                        access_record = UserProductAccess(
                            user_id=subscription.user_id,
                            product_id=product.id,
                            access_type=AccessType.SUBSCRIPTION
                        )
                        db.add(access_record)
                        logger.info(f"Надано доступ до товару {product.id} по підписці {subscription.id}")

                # Відправляємо email підтвердження
                user = await db.get(User, subscription.user_id)
                if user and user.email:
                    await email_service.send_subscription_confirmation(
                        user_email=user.email,
                        end_date=subscription.end_date.strftime('%Y-%m-%d')
                    )

                logger.info(f"Subscription {order_id} activated successfully")

            elif status in ["cancel", "wrong_amount", "fail", "system_fail", "refund"]:
                subscription.status = SubscriptionStatus.CANCELLED
                logger.warning(f"Subscription {order_id} payment failed with status: {status}")

        else:
            # Обробка звичайного замовлення
            order = await db.get(Order, order_id)

            if not order:
                logger.error(f"Order {order_id} not found")
                raise HTTPException(
                    status_code=404,
                    detail=f"Order {order_id} not found"
                )

            # Перевіряємо чи payment_id співпадає
            if order.payment_id and order.payment_id != payment_id:
                logger.warning(
                    f"Payment ID mismatch for order {order_id}: expected {order.payment_id}, got {payment_id}")

            if status == "paid" and order.status != "paid":
                # Оновлюємо статус замовлення
                order.status = "paid"
                order.paid_at = datetime.utcnow()
                order.payment_id = payment_id

                # Надаємо доступ до товарів
                for item in order.items:
                    # Перевіряємо чи вже є доступ
                    existing_access = await db.execute(
                        select(UserProductAccess).where(
                            UserProductAccess.user_id == order.user_id,
                            UserProductAccess.product_id == item.product_id
                        )
                    )
                    if not existing_access.scalar_one_or_none():
                        access = UserProductAccess(
                            user_id=order.user_id,
                            product_id=item.product_id,
                            access_type=AccessType.PURCHASE
                        )
                        db.add(access)

                # Відправляємо email з підтвердженням та посиланнями
                if order.user.email:
                    products_for_email = []
                    for item in order.items:
                        products_for_email.append({
                            'title': item.product.get_translation('uk').title,
                            'price': float(item.price_at_purchase)
                        })

                    await email_service.send_order_confirmation(
                        user_email=order.user.email,
                        order_id=order.id,
                        products=products_for_email,
                        total_amount=float(order.final_total)
                    )

                # Списуємо бонуси якщо були використані
                if order.bonus_used > 0:
                    order.user.bonus_balance -= order.bonus_used

                # Оновлюємо лічильник використань промокоду
                if order.promo_code_id:
                    promo = await db.get(PromoCode, order.promo_code_id)
                    if promo:
                        promo.current_uses += 1

                logger.info(f"Order {order_id} paid successfully")

            elif status in ["cancel", "wrong_amount", "fail", "system_fail"]:
                order.status = "failed"

                # Повертаємо бонуси якщо були використані
                if order.bonus_used > 0:
                    order.user.bonus_balance += order.bonus_used
                    logger.info(f"Returned {order.bonus_used} bonus points to user {order.user_id}")

                logger.warning(f"Order {order_id} payment failed with status: {status}")

            elif status == "refund":
                order.status = "refunded"

                # Видаляємо доступ до товарів
                await db.execute(
                    select(UserProductAccess).where(
                        UserProductAccess.user_id == order.user_id,
                        UserProductAccess.product_id.in_([item.product_id for item in order.items])
                    ).delete()
                )

                # Повертаємо бонуси
                if order.bonus_used > 0:
                    order.user.bonus_balance += order.bonus_used

                logger.info(f"Order {order_id} refunded")

        # 6. Зберігаємо зміни
        await db.commit()

        # 7. Позначаємо webhook як оброблений
        await mark_webhook_processed(payment_id, status, db)

        logger.info(f"Webhook {payment_id} processed successfully with status: {status}")

        return {
            "status": "ok",
            "message": f"Webhook processed successfully",
            "payment_id": payment_id,
            "order_id": order_id,
            "payment_status": status
        }

    except HTTPException:
        # Пробрасуємо HTTP помилки далі
        raise

    except Exception as e:
        # Логуємо непередбачені помилки
        logger.error(f"Unexpected error processing webhook: {str(e)}", exc_info=True)

        # Повертаємо 500 для retry від Cryptomus
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )