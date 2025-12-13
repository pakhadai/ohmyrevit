import logging
from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone
from decimal import Decimal

from app.core.database import get_db
from app.orders.models import Order, WebhookProcessed, OrderStatus
from app.subscriptions.models import Subscription, SubscriptionStatus
from app.products.models import Product
from app.users.models import User
from app.users.dependencies import get_current_user
from app.orders.service import OrderService
from app.orders.schemas import CreateOrderRequest, ApplyDiscountRequest, ApplyDiscountResponse, CheckoutResponse
from app.payments.cryptomus import CryptomusClient
from app.core.config import settings
from app.core.telegram_service import telegram_service
from app.core.translations import get_text

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orders"])


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_order(
        data: CreateOrderRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    try:
        lang = current_user.language_code or "uk"
        order = await service.create_order(
            user_id=current_user.id,
            product_ids=data.product_ids,
            promo_code=data.promo_code,
            use_bonus_points=data.use_bonus_points,
            language_code=lang
        )

        if order.final_total <= 0:
            order = await service.process_successful_order(order.id)
            logger.info(f"Order {order.id} was fully covered by discount. Access granted immediately.")
            return CheckoutResponse(
                order_id=order.id,
                payment_url=None,
                amount=Decimal("0.0")
            )

        cryptomus = CryptomusClient()
        payment_data = await cryptomus.create_payment(
            amount=order.final_total,
            order_id=str(order.id)
        )
        result = payment_data.get("result", {})
        order.payment_url = result.get("url")
        order.payment_id = result.get("uuid")
        await db.commit()

        return CheckoutResponse(
            order_id=order.id,
            payment_url=order.payment_url,
            amount=order.final_total
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating checkout: {e}", exc_info=True)
        lang = current_user.language_code or "uk"
        raise HTTPException(
            status_code=500,
            detail=get_text("order_error_create_internal", lang)
        )


@router.post("/promo/apply", response_model=ApplyDiscountResponse)
async def apply_discount(
        data: ApplyDiscountRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = OrderService(db)
    lang = current_user.language_code or "uk"

    try:
        products_result = await db.execute(
            select(Product).where(Product.id.in_(data.product_ids))
        )
        products = products_result.scalars().all()
        if not products:
            raise ValueError(get_text("order_error_products_not_found", lang))

        subtotal = sum(p.get_actual_price() for p in products)

        discount_data = await service.calculate_discount(
            subtotal=subtotal,
            user_id=current_user.id,
            promo_code=data.promo_code,
            bonus_points=data.use_bonus_points or 0,
            language_code=lang
        )

        final_total = subtotal - discount_data["discount_amount"]

        return ApplyDiscountResponse(
            success=True,
            discount_amount=discount_data["discount_amount"],
            final_total=max(final_total, Decimal(0)),
            bonus_points_used=discount_data["bonus_used"]
        )

    except ValueError as e:
        products_result = await db.execute(select(Product).where(Product.id.in_(data.product_ids)))
        products = products_result.scalars().all()
        subtotal_on_error = sum(p.get_actual_price() for p in products) if products else 0
        return ApplyDiscountResponse(
            success=False,
            final_total=subtotal_on_error,
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Error applying discount: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=get_text("order_error_internal", lang)
        )


async def check_webhook_processed(payment_id: str, db: AsyncSession) -> bool:
    if not payment_id:
        return False
    result = await db.get(WebhookProcessed, payment_id)
    return result is not None


async def mark_webhook_processed(payment_id: str, status: str, db: AsyncSession):
    if not await db.get(WebhookProcessed, payment_id):
        webhook_record = WebhookProcessed(
            processed_at=datetime.now(timezone.utc),
            payment_id=payment_id,
            status=status,
            success=True
        )
        db.add(webhook_record)
        await db.commit()


@router.post("/webhooks/cryptomus")
async def cryptomus_webhook(
        request: Request,
        data: dict = Body(...),
        db: AsyncSession = Depends(get_db)
):
    cryptomus_client = CryptomusClient()
    sign = request.headers.get("sign")

    if not sign:
        logger.error("Webhook missing signature header")
        raise HTTPException(status_code=403, detail="Missing signature")

    if not cryptomus_client.verify_webhook(data, sign):
        logger.error("Invalid webhook signature provided")
        raise HTTPException(status_code=403, detail="Invalid signature")

    payment_id = data.get("uuid") or data.get("payment_id")
    order_id_str = data.get("order_id")
    status = data.get("status")

    paid_amount = data.get("amount")

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
        if is_subscription:
            subscription = await db.get(Subscription, order_id, options=[selectinload(Subscription.user)])
            if not subscription:
                logger.error(f"Subscription {order_id} not found for webhook.")
                await mark_webhook_processed(payment_id, "error_not_found", db)
                return {"status": "error", "message": "Subscription not found"}

            if status == "paid" or status == "paid_over":
                if subscription.status != SubscriptionStatus.ACTIVE:
                    subscription.status = SubscriptionStatus.ACTIVE
                    subscription.payment_id = payment_id

                    lang = subscription.user.language_code or "uk"
                    date_str = subscription.end_date.strftime("%d.%m.%Y")
                    msg = get_text("order_sub_activated_msg", lang, date_str=date_str)
                    await telegram_service.send_message(subscription.user.telegram_id, msg)

            elif status == "wrong_amount":
                logger.critical(f"SUBSCRIPTION {order_id}: Wrong amount paid! Received: {paid_amount}")
                pass

            elif status in ["cancel", "fail", "system_fail", "refund"]:
                subscription.status = SubscriptionStatus.CANCELLED

        else:
            order_res = await db.execute(select(Order).where(Order.id == order_id))
            order = order_res.scalar_one_or_none()
            if not order:
                logger.error(f"Order {order_id} not found for webhook.")
                await mark_webhook_processed(payment_id, "error_not_found", db)
                return {"status": "error", "message": "Order not found"}

            if (status == "paid" or status == "paid_over") and order.status != OrderStatus.PAID:
                order.payment_id = payment_id
                service = OrderService(db)
                await service.process_successful_order(order.id)

            elif status == "wrong_amount":
                logger.critical(
                    f"ORDER {order_id}: Wrong amount paid! Received: {paid_amount}, Expected: {order.final_total}")

            elif status in ["cancel", "fail", "system_fail"]:
                order.status = OrderStatus.FAILED
                if order.bonus_used > 0:
                    user_query = select(User).where(User.id == order.user_id).with_for_update()
                    user_res = await db.execute(user_query)
                    user_to_refund = user_res.scalar_one_or_none()

                    if user_to_refund:
                        user_to_refund.bonus_balance += order.bonus_used
                        logger.info(
                            f"Returned {order.bonus_used} bonus points to user {order.user_id} due to failed payment")

        await mark_webhook_processed(payment_id, status, db)
        await db.commit()

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")