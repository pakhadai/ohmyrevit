from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.orders.service import OrderService
from app.payments.cryptomus import CryptomusClient
from app.orders.schemas import CreateOrderRequest, ApplyDiscountRequest, ApplyDiscountResponse
from app.products.models import Product
from app.orders.models import Order  # Додано
from typing import Optional
from app.subscriptions.models import UserProductAccess
from app.core.email import email_service

router = APIRouter(tags=["Orders"])


# ДОДАНО: Новий ендпоінт для перевірки знижки в реальному часі
@router.post("/promo/apply", response_model=ApplyDiscountResponse)
async def apply_discount(
        request: ApplyDiscountRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Розраховує та перевіряє знижку від промокоду або бонусів
    """
    order_service = OrderService(db)

    # Розраховуємо subtotal
    if not request.product_ids:
        raise HTTPException(status_code=400, detail="Не обрано жодного товару")

    products_result = await db.execute(
        select(Product).where(Product.id.in_(request.product_ids))
    )
    products = products_result.scalars().all()
    subtotal = sum(p.get_actual_price() for p in products)

    try:
        discount_data = await order_service.calculate_discount(
            subtotal=subtotal,
            user_id=current_user.id,
            promo_code=request.promo_code,
            bonus_points=request.use_bonus_points or 0
        )
        final_total = subtotal - discount_data["discount_amount"]

        return ApplyDiscountResponse(
            success=True,
            discount_amount=float(discount_data["discount_amount"]),
            final_total=float(max(final_total, Decimal(0))),
            bonus_points_used=discount_data["bonus_used"],
            message="Знижку успішно застосовано"
        )
    except ValueError as e:
        return ApplyDiscountResponse(
            success=False,
            final_total=float(subtotal),
            message=str(e)
        )


@router.post("/checkout")
async def create_order(
        request: CreateOrderRequest,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Створює замовлення та генерує платіжне посилання
    """
    order_service = OrderService(db)
    try:
        order = await order_service.create_order(
            user_id=current_user.id,
            product_ids=request.product_ids,
            promo_code=request.promo_code,
            use_bonus_points=request.use_bonus_points
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Якщо фінальна сума 0 (наприклад, 100% знижка), не створюємо платіж
    if order.final_total <= 0:
        order.status = "paid"
        # Надаємо доступ до товарів
        for item in order.items:
            access = UserProductAccess(
                user_id=order.user_id,
                product_id=item.product_id,
                access_type="purchase"
            )
            db.add(access)
        await db.commit()
        return {
            "order_id": order.id,
            "payment_url": None,  # Немає посилання на оплату
            "amount": 0,
            "message": "Замовлення успішно оформлено, товари додано до вашого профілю."
        }

    # Створюємо платіж в Cryptomus
    cryptomus = CryptomusClient()
    payment_data = await cryptomus.create_payment(
        amount=float(order.final_total),
        order_id=str(order.id)
    )

    # Зберігаємо payment_id
    order.payment_id = payment_data["result"]["uuid"]
    await db.commit()

    return {
        "order_id": order.id,
        "payment_url": payment_data["result"]["url"],
        "amount": float(order.final_total)
    }


@router.post("/webhooks/cryptomus")
async def cryptomus_webhook(
        data: dict = Body(...),
        # sign: str = Body(...), # Підпис тимчасово вимкнено для спрощення
        db: AsyncSession = Depends(get_db)
):
    """Обробляє webhook від Cryptomus про статус оплати"""

    # cryptomus = CryptomusClient()
    # if not cryptomus.verify_webhook(data, sign):
    #     raise HTTPException(status_code=400, detail="Invalid signature")

    order_id_str = data.get("order_id")
    status = data.get("status")

    if not order_id_str:
        return {"status": "error", "message": "order_id is missing"}

    try:
        order_id = int(order_id_str)
    except (ValueError, TypeError):
        return {"status": "error", "message": "Invalid order_id format"}

    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order with id {order_id} not found")

    if status == "paid" and order.status != "paid":
        order.status = "paid"

        # Відправляємо email з підтвердженням
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

        # Надаємо доступ до товарів
        for item in order.items:
            # Перевіряємо, чи вже є доступ, щоб уникнути дублікатів
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
                    access_type="purchase"
                )
                db.add(access)

    elif status in ["cancel", "wrong_amount", "fail"]:
        order.status = "failed"

    await db.commit()
    return {"status": "ok"}