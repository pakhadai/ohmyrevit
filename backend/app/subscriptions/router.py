from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.subscriptions.service import SubscriptionService
from app.payments.cryptomus import CryptomusClient
from sqlalchemy import select
from datetime import datetime, timezone
from app.subscriptions.models import Subscription
from app.core.config import settings
from app.core.translations import get_text

router = APIRouter(tags=["subscriptions"])


@router.post("/checkout")
async def create_subscription_checkout(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = SubscriptionService(db)
    try:
        subscription = await service.create_subscription(current_user.id)

        cryptomus = CryptomusClient()
        payment_data = await cryptomus.create_payment(
            amount=settings.SUBSCRIPTION_PRICE_USD,
            order_id=f"sub_{subscription.id}"
        )

        subscription.payment_id = payment_data["result"]["uuid"]
        await db.commit()

        return {
            "subscription_id": subscription.id,
            "payment_url": payment_data["result"]["url"],
            "amount": settings.SUBSCRIPTION_PRICE_USD
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/cancel")
async def cancel_subscription(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    service = SubscriptionService(db)
    success = await service.cancel_active_subscription(current_user.id)
    lang = current_user.language_code or "uk"

    if not success:
        raise HTTPException(
            status_code=404,
            detail=get_text("sub_error_active_not_found", lang)
        )

    return {
        "success": True,
        "message": get_text("sub_cancel_success_msg", lang)
    }


@router.get("/status")
async def get_subscription_status(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
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
            "days_remaining": max(0, (subscription.end_date - datetime.now(timezone.utc)).days),
            "is_auto_renewal": subscription.is_auto_renewal
        }
    }