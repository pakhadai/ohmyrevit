from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.orders.service import OrderService
from app.payments.cryptomus import CryptomusClient
from app.orders.schemas import CreateOrderRequest, OrderResponse
from typing import Optional
from app.subscriptions.models import UserProductAccess

router = APIRouter(prefix="/api/v1/orders", tags=["orders"])


@router.post("/checkout")
async def create_order(
        request: CreateOrderRequest,
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """
    Створює замовлення та генерує платіжне посилання

    request містить:
    - product_ids: список ID товарів
    - promo_code: промокод (опційно)
    - use_bonus_points: кількість бонусів (опційно)
    """

    # Перевірка: або промокод АБО бонуси
    if request.promo_code and request.use_bonus_points:
        raise HTTPException(
            status_code=400,
            detail="Можна застосувати лише один тип знижки"
        )

    # Створюємо замовлення
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
        sign: str = Body(...),
        db: AsyncSession = Depends(get_db)
):
    """Обробляє webhook від Cryptomus про статус оплати"""

    cryptomus = CryptomusClient()

    # Перевіряємо підпис
    if not cryptomus.verify_webhook(data, sign):
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Оновлюємо статус замовлення
    order_id = data.get("order_id")
    status = data.get("status")

    order = await db.get(Order, int(order_id))
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if status == "paid":
        order.status = "paid"

        # Надаємо доступ до товарів
        for item in order.items:
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