import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal

from app.core.database import get_db
from app.products.models import Product
from app.users.models import User
from app.users.dependencies import get_current_user
from app.orders.service import OrderService, COINS_PER_USD
from app.orders.schemas import (
    CreateOrderRequest,
    ApplyDiscountRequest,
    ApplyDiscountResponse,
    CheckoutResponse,
    InsufficientFundsResponse
)
from app.core.translations import get_text

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Orders"])


@router.post("/checkout")
async def create_checkout_order(
        data: CreateOrderRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Створює замовлення та миттєво списує монети з балансу.

    Нова логіка (OMR Coins):
    1. Перевіряємо баланс користувача
    2. Якщо достатньо — списуємо монети та надаємо доступ
    3. Якщо недостатньо — повертаємо помилку з інформацією скільки не вистачає
    """
    service = OrderService(db)
    lang = current_user.language_code or "uk"

    try:
        result = await service.create_order(
            user_id=current_user.id,
            product_ids=data.product_ids,
            promo_code=data.promo_code,
            language_code=lang
        )

        return CheckoutResponse(
            success=True,
            order_id=result["order"].id,
            coins_spent=result["coins_spent"],
            new_balance=result["new_balance"],
            message="Покупка успішна! Перейдіть в 'Мої покупки' для завантаження.",
            payment_url=None,  # Deprecated - оплата миттєва
            amount=result["order"].final_total  # Deprecated - для сумісності
        )

    except ValueError as e:
        error_msg = str(e)

        # Перевіряємо чи це помилка недостатнього балансу
        if error_msg.startswith("INSUFFICIENT_FUNDS|"):
            parts = error_msg.split("|")
            required = int(parts[1])
            current = int(parts[2])
            shortfall = int(parts[3])

            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail={
                    "error": "insufficient_funds",
                    "required_coins": required,
                    "current_balance": current,
                    "shortfall": shortfall,
                    "message": f"Недостатньо монет. Потрібно: {required}, у вас: {current}. Поповніть баланс на {shortfall} монет."
                }
            )

        # Інші помилки валідації
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )

    except Exception as e:
        logger.error(f"Error creating checkout: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("order_error_create_internal", lang)
        )


@router.post("/promo/apply", response_model=ApplyDiscountResponse)
async def apply_discount(
        data: ApplyDiscountRequest,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Розраховує знижку та перевіряє баланс користувача.
    Використовується для preview перед checkout.
    """
    service = OrderService(db)
    lang = current_user.language_code or "uk"

    try:
        # Отримуємо товари
        products_result = await db.execute(
            select(Product).where(Product.id.in_(data.product_ids))
        )
        products = list(products_result.scalars().all())

        if not products:
            raise ValueError(get_text("order_error_products_not_found", lang))

        # Рахуємо суму в монетах
        subtotal_usd = sum(p.get_actual_price() for p in products)
        subtotal_coins = service.usd_to_coins(subtotal_usd)

        # Розраховуємо знижку
        discount_data = await service.calculate_discount(
            subtotal_coins=subtotal_coins,
            user_id=current_user.id,
            promo_code=data.promo_code,
            language_code=lang
        )

        final_coins = subtotal_coins - discount_data["discount_coins"]
        final_coins = max(final_coins, 0)

        # Перевіряємо баланс
        has_enough, current_balance = await service.check_user_balance(
            current_user.id,
            final_coins
        )

        return ApplyDiscountResponse(
            success=True,
            subtotal_coins=subtotal_coins,
            discount_coins=discount_data["discount_coins"],
            final_coins=final_coins,
            user_balance=current_balance,
            has_enough_balance=has_enough,
            message=None if has_enough else f"Недостатньо монет. Потрібно ще {final_coins - current_balance}"
        )

    except ValueError as e:
        # При помилці валідації повертаємо базову інформацію
        products_result = await db.execute(
            select(Product).where(Product.id.in_(data.product_ids))
        )
        products = list(products_result.scalars().all())
        subtotal_usd = sum(p.get_actual_price() for p in products) if products else Decimal("0")
        subtotal_coins = int(subtotal_usd * COINS_PER_USD)

        # Отримуємо баланс
        user = await db.get(User, current_user.id)
        current_balance = user.balance if user else 0

        return ApplyDiscountResponse(
            success=False,
            subtotal_coins=subtotal_coins,
            discount_coins=0,
            final_coins=subtotal_coins,
            user_balance=current_balance,
            has_enough_balance=current_balance >= subtotal_coins,
            message=str(e)
        )

    except Exception as e:
        logger.error(f"Error applying discount: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("order_error_internal", lang)
        )


@router.get("/preview")
async def preview_order(
        product_ids: str,  # Comma-separated: "1,2,3"
        promo_code: str = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Попередній перегляд замовлення перед оплатою.
    Показує ціни в монетах та чи достатньо балансу.
    """
    service = OrderService(db)
    lang = current_user.language_code or "uk"

    try:
        # Парсимо product_ids
        ids = [int(x.strip()) for x in product_ids.split(",") if x.strip()]

        if not ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="product_ids is required"
            )

        # Отримуємо товари
        products_result = await db.execute(
            select(Product).where(Product.id.in_(ids))
        )
        products = list(products_result.scalars().all())

        if not products:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=get_text("order_error_products_not_found", lang)
            )

        # Формуємо інформацію про товари
        items = []
        for p in products:
            translation = p.get_translation(lang)
            price_usd = p.get_actual_price()
            price_coins = service.usd_to_coins(price_usd)

            items.append({
                "id": p.id,
                "title": translation.title if translation else f"Product #{p.id}",
                "price_usd": float(price_usd),
                "price_coins": price_coins,
                "main_image_url": p.main_image_url
            })

        # Рахуємо суми
        subtotal_usd = sum(p.get_actual_price() for p in products)
        subtotal_coins = service.usd_to_coins(subtotal_usd)

        # Знижка
        discount_coins = 0
        if promo_code:
            try:
                discount_data = await service.calculate_discount(
                    subtotal_coins, current_user.id, promo_code, lang
                )
                discount_coins = discount_data["discount_coins"]
            except ValueError:
                pass  # Ігноруємо невалідний промокод

        final_coins = max(subtotal_coins - discount_coins, 0)

        # Баланс
        user = await db.get(User, current_user.id)
        current_balance = user.balance if user else 0
        has_enough = current_balance >= final_coins

        return {
            "items": items,
            "subtotal_coins": subtotal_coins,
            "subtotal_usd": float(subtotal_usd),
            "discount_coins": discount_coins,
            "final_coins": final_coins,
            "final_usd": float(service.coins_to_usd(final_coins)),
            "user_balance": current_balance,
            "has_enough_balance": has_enough,
            "shortfall": max(final_coins - current_balance, 0) if not has_enough else 0
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error previewing order: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to preview order"
        )