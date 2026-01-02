import logging
import hashlib
import hmac
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

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
    GumroadWebhookResponse,
    TransactionTypeEnum
)
from app.wallet.models import TransactionType
from app.core.telegram_service import telegram_service
from app.wallet.utils import coin_pack_to_response

logger = logging.getLogger(__name__)

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
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    service = WalletAdminService(db)
    packs = await service.get_all_coin_packs()
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


@webhook_router.post("/gumroad", response_model=GumroadWebhookResponse)
async def gumroad_webhook(
        request: Request,
        db: AsyncSession = Depends(get_db)
):
    try:
        raw_body = await request.body()
        form_data = await request.form()
        data = dict(form_data)

        logger.info(f"Gumroad webhook payload keys: {list(data.keys())}")
        sale_id = data.get("sale_id")
        logger.info(f"Gumroad webhook received: sale_id={sale_id}")

        if sale_id:
            idempotency_key = f"gumroad:sale:{sale_id}"
            if await cache.get(idempotency_key):
                logger.info(f"Duplicate webhook ignored: {sale_id}")
                return GumroadWebhookResponse(
                    success=True,
                    message="Transaction already processed"
                )

        if settings.GUMROAD_WEBHOOK_SECRET:
            signature = request.headers.get("X-Gumroad-Signature")
            if not verify_gumroad_signature(raw_body, signature):
                logger.warning("Invalid Gumroad webhook signature")
                if settings.ENVIRONMENT == "production":
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid signature"
                    )

        permalink = data.get("permalink") or data.get("product_permalink")
        price = int(data.get("price", 0))

        is_refunded = str(data.get("refunded", "")).lower() == "true"
        if is_refunded:
            logger.info(f"Skipping refunded transaction: {sale_id}")
            return GumroadWebhookResponse(
                success=True,
                message="Refund processed"
            )

        user_id = None
        potential_keys = [
            "custom_fields[user_id]",
            "url_params[user_id]",
            "user_id"
        ]

        for key in potential_keys:
            if key in data and data[key]:
                logger.info(f"Found user_id in key '{key}': {data[key]}")
                user_id = data[key]
                break

        if not user_id:
            for json_field in ["custom_fields", "url_params"]:
                content = data.get(json_field)
                if content and isinstance(content, str):
                    try:
                        import json
                        parsed = json.loads(content)
                        if isinstance(parsed, dict) and "user_id" in parsed:
                            user_id = parsed["user_id"]
                            logger.info(f"Found user_id in parsed JSON '{json_field}': {user_id}")
                            break
                    except:
                        continue

        if not user_id:
            buyer_email = data.get("email")
            if buyer_email:
                logger.info(f"user_id not found, trying email fallback: {buyer_email}")
                email_query = select(User).where(User.email == buyer_email)
                email_result = await db.execute(email_query)
                user_by_email = email_result.scalar_one_or_none()

                if user_by_email:
                    user_id = user_by_email.id
                    logger.info(f"Found user by email: {buyer_email} -> user_id={user_id}")
                else:
                    logger.warning(f"No user found with email: {buyer_email}")

        if not user_id:
            logger.error(f"No user_id found in Gumroad webhook: {sale_id}")
            return GumroadWebhookResponse(
                success=False,
                message="Missing user_id - user not found by params or email"
            )

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            logger.error(f"Invalid user_id format: {user_id}")
            return GumroadWebhookResponse(
                success=False,
                message="Invalid user_id format"
            )

        service = WalletService(db)

        try:
            transaction = await service.process_gumroad_purchase(
                user_id=user_id,
                permalink=permalink,
                sale_id=sale_id,
                amount_cents=price
            )
        except ValueError as e:
            if "already processed" in str(e):
                logger.info(f"Transaction {sale_id} already processed")
                return GumroadWebhookResponse(
                    success=True,
                    message="Transaction already processed"
                )
            raise

        if sale_id:
            await cache.set(idempotency_key, "1", ttl=86400)

        try:
            user = await db.get(User, user_id)
            if user and user.telegram_id:
                coin_pack = await service.get_coin_pack_by_permalink(permalink)
                pack_name = coin_pack.name if coin_pack else permalink

                message = (
                    f"✅ *Баланс поповнено!*\n\n"
                    f"💰 Сума: *+{transaction.amount} OMR*\n"
                    f"📦 Пакет: {pack_name}\n"
                    f"💳 Вартість: ${price / 100:.2f}\n"
                    f"💵 Поточний баланс: *{transaction.balance_after} OMR*"
                )
                await telegram_service.send_message(user.telegram_id, message)
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")

        logger.info(
            f"Gumroad purchase successful: user={user_id}, "
            f"coins={transaction.amount}, balance={transaction.balance_after}"
        )

        return GumroadWebhookResponse(
            success=True,
            message="Coins added successfully",
            user_id=user_id,
            coins_added=transaction.amount,
            new_balance=transaction.balance_after
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Gumroad webhook error: {e}")
        return GumroadWebhookResponse(
            success=False,
            message=f"Internal error: {str(e)}"
        )


def verify_gumroad_signature(request_body: bytes, signature: str) -> bool:
    if not signature or not settings.GUMROAD_WEBHOOK_SECRET:
        if settings.ENVIRONMENT == "development":
            return True
        return False

    try:
        expected_signature = hmac.new(
            settings.GUMROAD_WEBHOOK_SECRET.encode('utf-8'),
            request_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Signature verification error: {e}")
        return False