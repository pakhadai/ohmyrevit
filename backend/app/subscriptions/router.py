from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.subscriptions.service import SubscriptionService, SUBSCRIPTION_PRICE_COINS
from app.core.translations import get_text

router = APIRouter(tags=["Subscriptions"])


# ============ Response Schemas ============

class SubscriptionCheckoutResponse(BaseModel):
    success: bool
    subscription_id: int
    coins_spent: int
    new_balance: int
    is_extension: bool
    end_date: str
    message: str

    # Deprecated fields for compatibility
    payment_url: Optional[str] = None
    amount: Optional[float] = None


class SubscriptionStatusResponse(BaseModel):
    has_active_subscription: bool
    subscription: Optional[dict] = None


class SubscriptionPriceResponse(BaseModel):
    price_coins: int
    price_usd: float
    user_balance: int
    has_enough_balance: bool
    shortfall: int


# ============ Endpoints ============

@router.get("/price", response_model=SubscriptionPriceResponse)
async def get_subscription_price(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Отримати ціну підписки та перевірити баланс"""
    user = await db.get(User, current_user.id)
    balance = user.balance if user else 0
    has_enough = balance >= SUBSCRIPTION_PRICE_COINS

    return SubscriptionPriceResponse(
        price_coins=SUBSCRIPTION_PRICE_COINS,
        price_usd=SUBSCRIPTION_PRICE_COINS / 100,  # 500 coins = $5
        user_balance=balance,
        has_enough_balance=has_enough,
        shortfall=max(SUBSCRIPTION_PRICE_COINS - balance, 0) if not has_enough else 0
    )


@router.post("/checkout", response_model=SubscriptionCheckoutResponse)
async def purchase_subscription(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Купує підписку за OMR Coins (миттєве списання).

    - Якщо є активна підписка - продовжує її
    - Якщо немає - створює нову
    - Надає доступ до всіх Premium товарів
    """
    service = SubscriptionService(db)
    lang = current_user.language_code or "uk"

    try:
        result = await service.purchase_subscription(current_user.id)

        return SubscriptionCheckoutResponse(
            success=True,
            subscription_id=result["subscription"].id,
            coins_spent=result["coins_spent"],
            new_balance=result["new_balance"],
            is_extension=result["is_extension"],
            end_date=result["subscription"].end_date.isoformat(),
            message="Premium підписку продовжено!" if result["is_extension"] else "Premium підписку активовано!",
            payment_url=None,  # Deprecated
            amount=SUBSCRIPTION_PRICE_COINS / 100  # Deprecated
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
                    "message": f"Недостатньо монет для підписки. Потрібно: {required}, у вас: {current}. Поповніть баланс на {shortfall} монет."
                }
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )


@router.delete("/cancel")
async def cancel_subscription(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Скасовує автопродовження підписки.
    Підписка залишається активною до кінця оплаченого періоду.
    """
    service = SubscriptionService(db)
    lang = current_user.language_code or "uk"

    success = await service.cancel_auto_renewal(current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("sub_error_active_not_found", lang)
        )

    return {
        "success": True,
        "message": get_text("sub_cancel_success_msg", lang)
    }


@router.post("/auto-renewal/enable")
async def enable_auto_renewal(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Вмикає автопродовження підписки"""
    service = SubscriptionService(db)
    lang = current_user.language_code or "uk"

    success = await service.enable_auto_renewal(current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=get_text("sub_error_active_not_found", lang)
        )

    return {
        "success": True,
        "message": "Автопродовження увімкнено"
    }


@router.get("/status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Отримати статус підписки користувача"""
    service = SubscriptionService(db)
    return await service.get_subscription_status(current_user.id)