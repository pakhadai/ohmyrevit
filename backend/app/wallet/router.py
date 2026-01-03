import logging
import stripe
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.cache import cache
from app.users.dependencies import get_current_user, get_current_admin_user
from app.users.models import User
from app.wallet.service import WalletService, WalletAdminService
from app.wallet.schemas import (
    CoinPackResponse, CoinPackCreate, CoinPackUpdate,
    TransactionResponse, TransactionListResponse,
    WalletBalanceResponse, WalletInfoResponse,
    StripeCheckoutResponse, StripeWebhookResponse,
    TransactionTypeEnum
)
from app.wallet.models import TransactionType
from app.core.telegram_service import telegram_service
from app.wallet.utils import coin_pack_to_response

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(tags=["Wallet"])
admin_router = APIRouter(tags=["Admin - Wallet"])
webhook_router = APIRouter(tags=["Webhooks"])


@router.get("/balance", response_model=WalletBalanceResponse)
async def get_my_balance(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletService(db)
    balance = await service.get_balance(current_user.id)

    return WalletBalanceResponse(
        balance=balance,
        balance_usd=balance / 100
    )


@router.get("/info", response_model=WalletInfoResponse)
async def get_wallet_info(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletService(db)

    balance = await service.get_balance(current_user.id)
    coin_packs = await service.get_active_coin_packs()
    transactions, _ = await service.get_user_transactions(current_user.id, limit=5)

    return WalletInfoResponse(
        balance=balance,
        balance_usd=balance / 100,
        coin_packs=[coin_pack_to_response(p) for p in coin_packs],
        recent_transactions=[
            TransactionResponse(
                id=t.id,
                type=TransactionTypeEnum(t.type.value),
                amount=t.amount,
                balance_after=t.balance_after,
                description=t.description,
                order_id=t.order_id,
                subscription_id=t.subscription_id,
                external_id=t.external_id,
                created_at=t.created_at
            ) for t in transactions
        ]
    )


@router.get("/coin-packs", response_model=List[CoinPackResponse])
async def get_coin_packs(
        db: AsyncSession = Depends(get_db)
):
    service = WalletService(db)
    packs = await service.get_active_coin_packs()
    return [coin_pack_to_response(p) for p in packs]


@router.get("/transactions", response_model=TransactionListResponse)
async def get_my_transactions(
        page: int = Query(1, ge=1),
        size: int = Query(20, ge=1, le=100),
        type: Optional[TransactionTypeEnum] = None,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletService(db)

    offset = (page - 1) * size
    transaction_type = TransactionType(type.value) if type else None

    transactions, total = await service.get_user_transactions(
        user_id=current_user.id,
        limit=size,
        offset=offset,
        transaction_type=transaction_type
    )

    return TransactionListResponse(
        items=[
            TransactionResponse(
                id=t.id,
                type=TransactionTypeEnum(t.type.value),
                amount=t.amount,
                balance_after=t.balance_after,
                description=t.description,
                order_id=t.order_id,
                subscription_id=t.subscription_id,
                external_id=t.external_id,
                created_at=t.created_at
            ) for t in transactions
        ],
        total=total,
        page=page,
        size=size
    )


@admin_router.get("/coin-packs", response_model=List[CoinPackResponse])
async def admin_get_all_coin_packs(
        include_inactive: bool = Query(False, description="Include inactive packs"),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)
    packs = await service.get_all_coin_packs(include_inactive=include_inactive)
    return [coin_pack_to_response(p) for p in packs]


@admin_router.post("/coin-packs", response_model=CoinPackResponse)
async def admin_create_coin_pack(
        data: CoinPackCreate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)
    pack = await service.create_coin_pack(**data.model_dump())
    return coin_pack_to_response(pack)


@admin_router.patch("/coin-packs/{pack_id}", response_model=CoinPackResponse)
async def admin_update_coin_pack(
        pack_id: int,
        data: CoinPackUpdate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)
    pack = await service.update_coin_pack(pack_id, **data.model_dump(exclude_unset=True))

    if not pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CoinPack not found"
        )

    return coin_pack_to_response(pack)


@admin_router.delete("/coin-packs/{pack_id}")
async def admin_delete_coin_pack(
        pack_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)
    success = await service.delete_coin_pack(pack_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CoinPack not found"
        )

    return {"success": True, "message": "CoinPack deactivated"}


@admin_router.post("/users/{user_id}/add-coins")
async def admin_add_coins_to_user(
        user_id: int,
        amount: int = Query(..., gt=0, description="Кількість монет для нарахування"),
        reason: str = Query(..., min_length=3, description="Причина нарахування"),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)

    try:
        transaction = await service.manual_add_coins(
            user_id=user_id,
            amount=amount,
            reason=reason,
            admin_id=admin.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    return {
        "success": True,
        "transaction_id": transaction.id,
        "new_balance": transaction.balance_after
    }


@router.post(
    "/create-checkout-session/{pack_id}",
    response_model=StripeCheckoutResponse
)
async def create_checkout_session(
        pack_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Creates a Stripe Checkout Session for purchasing a coin pack.
    Returns the checkout URL to redirect the user.
    """
    service = WalletService(db)

    # Get the coin pack
    coin_pack = await service.get_coin_pack_by_id(pack_id)
    if not coin_pack:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coin pack not found"
        )

    if not coin_pack.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coin pack is not available"
        )

    try:
        # Create Stripe Checkout Session
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': coin_pack.stripe_price_id,
                'quantity': 1,
            }],
            mode='payment',
            success_url=f"{settings.FRONTEND_URL}/profile/wallet/return"
                        f"?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/profile/wallet",
            metadata={
                'user_id': str(current_user.id),
                'pack_id': str(pack_id),
                'coins_amount': str(coin_pack.get_total_coins()),
            },
            customer_email=current_user.email if current_user.email else None,
        )

        logger.info(
            f"Stripe checkout session created: user={current_user.id}, "
            f"pack={pack_id}, session={checkout_session.id}"
        )

        return StripeCheckoutResponse(
            checkout_url=checkout_session.url,
            session_id=checkout_session.id
        )

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@webhook_router.post("/stripe", response_model=StripeWebhookResponse)
async def stripe_webhook(
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    """
    Handles Stripe webhook events.
    Listens for checkout.session.completed to add coins to user.
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid Stripe webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe webhook signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        session_id = session['id']

        logger.info(f"Stripe checkout completed: session={session_id}")

        # Check for duplicate processing
        idempotency_key = f"stripe:session:{session_id}"
        if await cache.get(idempotency_key):
            logger.info(f"Duplicate Stripe webhook ignored: {session_id}")
            return StripeWebhookResponse(
                success=True,
                message="Transaction already processed"
            )

        # Extract metadata
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        pack_id = metadata.get('pack_id')
        coins_amount = metadata.get('coins_amount')

        if not user_id or not pack_id:
            logger.error(
                f"Missing metadata in Stripe session: {session_id}"
            )
            return StripeWebhookResponse(
                success=False,
                message="Missing user_id or pack_id in metadata"
            )

        try:
            user_id = int(user_id)
            pack_id = int(pack_id)
        except (ValueError, TypeError) as e:
            logger.error(f"Invalid metadata format: {e}")
            return StripeWebhookResponse(
                success=False,
                message="Invalid metadata format"
            )

        # Process the purchase
        service = WalletService(db)

        try:
            amount_cents = session.get('amount_total', 0)
            transaction = await service.process_stripe_purchase(
                user_id=user_id,
                pack_id=pack_id,
                session_id=session_id,
                amount_cents=amount_cents
            )
        except ValueError as e:
            if "already processed" in str(e):
                logger.info(f"Transaction {session_id} already processed")
                return StripeWebhookResponse(
                    success=True,
                    message="Transaction already processed"
                )
            logger.error(f"Error processing Stripe purchase: {e}")
            return StripeWebhookResponse(
                success=False,
                message=str(e)
            )

        # Mark as processed
        await cache.set(idempotency_key, "1", ttl=86400)

        # Send Telegram notification
        try:
            user = await db.get(User, user_id)
            if user and user.telegram_id:
                coin_pack = await service.get_coin_pack_by_id(pack_id)
                pack_name = coin_pack.name if coin_pack else f"Pack #{pack_id}"
                price_usd = (session.get('amount_total', 0) / 100)

                message = (
                    f"✅ *Баланс поповнено!*\n\n"
                    f"💰 Сума: *+{transaction.amount} OMR*\n"
                    f"📦 Пакет: {pack_name}\n"
                    f"💳 Вартість: ${price_usd:.2f}\n"
                    f"💵 Поточний баланс: *{transaction.balance_after} OMR*"
                )
                await telegram_service.send_message(user.telegram_id, message)
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")

        logger.info(
            f"Stripe purchase successful: user={user_id}, "
            f"coins={transaction.amount}, balance={transaction.balance_after}"
        )

        return StripeWebhookResponse(
            success=True,
            message="Coins added successfully",
            user_id=user_id,
            coins_added=transaction.amount,
            new_balance=transaction.balance_after
        )

    # For other event types, just acknowledge
    logger.info(f"Unhandled Stripe event type: {event['type']}")
    return StripeWebhookResponse(
        success=True,
        message=f"Event {event['type']} received"
    )