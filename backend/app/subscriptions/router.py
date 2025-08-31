from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.subscriptions.service import SubscriptionService
from app.payments.cryptomus import CryptomusClient
from sqlalchemy import select
from datetime import datetime
from app.subscriptions.models import Subscription

router = APIRouter(prefix="/api/v1/subscriptions", tags=["subscriptions"])


@router.post("/checkout")
async def create_subscription_checkout(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Створює замовлення на підписку"""

    service = SubscriptionService(db)

    try:
        # Створюємо підписку (поки що pending)
        subscription = await service.create_subscription(current_user.id)
        subscription.status = "pending"  # Поки не оплачено
        await db.commit()

        # Створюємо платіж
        cryptomus = CryptomusClient()
        payment_data = await cryptomus.create_payment(
            amount=5.00,  # $5 за місяць
            order_id=f"sub_{subscription.id}"
        )

        subscription.payment_id = payment_data["result"]["uuid"]
        await db.commit()

        return {
            "subscription_id": subscription.id,
            "payment_url": payment_data["result"]["url"],
            "amount": 5.00
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
async def get_subscription_status(
        db: AsyncSession = Depends(get_db),
        current_user=Depends(get_current_user)
):
    """Отримує статус підписки користувача"""

    subscription = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == "active"
        ).order_by(Subscription.end_date.desc())
    )
    subscription = subscription.scalar_one_or_none()

    if not subscription:
        return {
            "has_active_subscription": False,
            "subscription": None
        }

    return {
        "has_active_subscription": True,
        "subscription": {
            "start_date": subscription.start_date,
            "end_date": subscription.end_date,
            "days_remaining": (subscription.end_date - datetime.utcnow()).days
        }
    }