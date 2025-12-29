from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.core.auth import require_admin
from app.users.models import User
from app.creators.admin_service import CreatorAdminService
from app.creators import admin_schemas
from app.core.email import email_service
from app.core.telegram_service import telegram_service
import logging

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/creators", tags=["Admin Creators"])


# ============ Creator Applications Moderation ============

@router.get("/applications/pending", response_model=List[admin_schemas.PendingApplicationResponse])
async def get_pending_applications(
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати заявки на статус креатора на розгляді.

    Доступно тільки адміністраторам.
    """
    service = CreatorAdminService(db)
    applications = await service.get_pending_applications(limit, offset)

    # Додати дані користувача
    result = []
    for app in applications:
        user = await db.get(User, app.user_id)
        result.append({
            "id": app.id,
            "user_id": app.user_id,
            "user_email": user.email if user else None,
            "user_name": f"{user.first_name} {user.last_name or ''}".strip() if user else "Unknown",
            "portfolio_url": app.portfolio_url,
            "motivation": app.motivation,
            "applied_at": app.applied_at
        })

    return result


@router.post("/applications/{application_id}/review")
async def review_application(
    application_id: int,
    data: admin_schemas.ApplicationReviewRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Розглянути заявку креатора (схвалити або відхилити).

    **action**: "approve" або "reject"
    """
    service = CreatorAdminService(db)

    try:
        if data.action == "approve":
            application = await service.approve_application(application_id, admin.id)

            # Отримати дані користувача для нотифікацій
            user = await db.get(User, application.user_id)
            if user:
                # Email нотифікація
                if user.email:
                    try:
                        await email_service.send_creator_application_approved(
                            user_email=user.email,
                            language_code=user.language_code or "uk"
                        )
                    except Exception as e:
                        logger.error(f"Failed to send email to user {user.id}: {e}")

                # Telegram нотифікація
                if user.telegram_id:
                    try:
                        await telegram_service.notify_creator_application_approved(
                            chat_id=user.telegram_id,
                            username=user.username or f"user_{user.id}"
                        )
                    except Exception as e:
                        logger.error(f"Failed to send Telegram to user {user.id}: {e}")

            return {
                "message": "Application approved successfully",
                "application_id": application.id,
                "user_id": application.user_id
            }
        elif data.action == "reject":
            if not data.rejection_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rejection reason is required"
                )
            application = await service.reject_application(
                application_id, admin.id, data.rejection_reason
            )
            return {
                "message": "Application rejected",
                "application_id": application.id,
                "reason": data.rejection_reason
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Use 'approve' or 'reject'"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Product Moderation ============

@router.get("/products/pending", response_model=List[admin_schemas.PendingProductResponse])
async def get_pending_products(
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати товари креаторів на модерації.

    Показує товари зі статусом PENDING.
    """
    service = CreatorAdminService(db)
    products = await service.get_pending_products(limit, offset)

    # Додати дані автора
    result = []
    for product in products:
        author = await db.get(User, product.author_id) if product.author_id else None
        translation = product.get_translation("uk")
        # Конвертуємо ціну в монети (1 USD = 100 coins)
        price_coins = int(float(product.price) * 100) if product.price else 0
        result.append({
            "id": product.id,
            "title": translation.title if translation else "Untitled",
            "description": translation.description if translation else "",
            "price_coins": price_coins,
            "author_id": product.author_id,
            "author_name": f"{author.first_name} {author.last_name or ''}".strip() if author else "Unknown",
            "file_url": product.zip_file_path,
            "images": product.gallery_image_urls or [],
            "created_at": product.created_at
        })

    return result


@router.post("/products/{product_id}/moderate")
async def moderate_product(
    product_id: int,
    data: admin_schemas.ProductModerationRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Модерувати товар креатора.

    **action**: "approve", "reject" або "hide"
    - approve: Схвалити та опублікувати
    - reject: Відхилити (креатор може виправити)
    - hide: Приховати (порушення правил)
    """
    service = CreatorAdminService(db)

    try:
        if data.action == "approve":
            product = await service.approve_product(product_id, admin.id)

            # Отримати дані автора для нотифікацій
            if product.author_id:
                author = await db.get(User, product.author_id)
                translation = product.get_translation("uk")
                product_title = translation.title if translation else "Untitled"

                if author:
                    # Email нотифікація
                    if author.email:
                        try:
                            await email_service.send_product_approved(
                                user_email=author.email,
                                product_title=product_title,
                                product_id=product.id,
                                language_code=author.language_code or "uk"
                            )
                        except Exception as e:
                            logger.error(f"Failed to send email to author {author.id}: {e}")

                    # Telegram нотифікація
                    if author.telegram_id:
                        try:
                            await telegram_service.notify_product_approved(
                                chat_id=author.telegram_id,
                                product_title=product_title,
                                product_id=product.id
                            )
                        except Exception as e:
                            logger.error(f"Failed to send Telegram to author {author.id}: {e}")

            return {
                "message": "Product approved successfully",
                "product_id": product.id
            }
        elif data.action == "reject":
            if not data.rejection_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rejection reason is required"
                )
            product = await service.reject_product(product_id, admin.id, data.rejection_reason)

            # Отримати дані автора для нотифікацій
            if product.author_id:
                author = await db.get(User, product.author_id)
                translation = product.get_translation("uk")
                product_title = translation.title if translation else "Untitled"

                if author:
                    # Email нотифікація
                    if author.email:
                        try:
                            await email_service.send_product_rejected(
                                user_email=author.email,
                                product_title=product_title,
                                rejection_reason=data.rejection_reason,
                                product_id=product.id,
                                language_code=author.language_code or "uk"
                            )
                        except Exception as e:
                            logger.error(f"Failed to send email to author {author.id}: {e}")

                    # Telegram нотифікація
                    if author.telegram_id:
                        try:
                            await telegram_service.notify_product_rejected(
                                chat_id=author.telegram_id,
                                product_title=product_title,
                                rejection_reason=data.rejection_reason,
                                product_id=product.id
                            )
                        except Exception as e:
                            logger.error(f"Failed to send Telegram to author {author.id}: {e}")

            return {
                "message": "Product rejected",
                "product_id": product.id,
                "reason": data.rejection_reason
            }
        elif data.action == "hide":
            if not data.rejection_reason:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Reason is required for hiding product"
                )
            product = await service.hide_product(product_id, admin.id, data.rejection_reason)
            return {
                "message": "Product hidden",
                "product_id": product.id,
                "reason": data.rejection_reason
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Use 'approve', 'reject' or 'hide'"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Payout Management ============

@router.get("/payouts/pending", response_model=List[admin_schemas.PendingPayoutResponse])
async def get_pending_payouts(
    limit: int = 50,
    offset: int = 0,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати виплати на розгляді.

    Показує всі запити на виплату USDT, які очікують обробки.
    """
    service = CreatorAdminService(db)
    payouts = await service.get_pending_payouts(limit, offset)

    # Додати дані креатора
    result = []
    for payout in payouts:
        creator = await db.get(User, payout.creator_id)
        result.append({
            "id": payout.id,
            "creator_id": payout.creator_id,
            "creator_email": creator.email if creator else None,
            "creator_name": f"{creator.first_name} {creator.last_name or ''}".strip() if creator else "Unknown",
            "amount_coins": payout.amount_coins,
            "amount_usd": payout.amount_usd,
            "usdt_address": payout.usdt_address,
            "usdt_network": payout.usdt_network,
            "requested_at": payout.requested_at
        })

    return result


@router.post("/payouts/{payout_id}/approve")
async def approve_payout(
    payout_id: int,
    data: admin_schemas.PayoutApprovalRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Підтвердити виплату (після відправки USDT).

    **transaction_hash**: Хеш транзакції в блокчейні
    """
    service = CreatorAdminService(db)

    try:
        payout = await service.approve_payout(payout_id, data.transaction_hash)

        # Отримати дані креатора для нотифікацій
        creator = await db.get(User, payout.creator_id)
        if creator:
            # Email нотифікація
            if creator.email:
                try:
                    await email_service.send_payout_processed(
                        user_email=creator.email,
                        amount=payout.amount_usd,
                        method=f"USDT ({payout.usdt_network})",
                        language_code=creator.language_code or "uk"
                    )
                except Exception as e:
                    logger.error(f"Failed to send email to creator {creator.id}: {e}")

            # Telegram нотифікація
            if creator.telegram_id:
                try:
                    await telegram_service.notify_payout_processed(
                        chat_id=creator.telegram_id,
                        amount=payout.amount_usd,
                        method=f"USDT ({payout.usdt_network})"
                    )
                except Exception as e:
                    logger.error(f"Failed to send Telegram to creator {creator.id}: {e}")

        return {
            "message": "Payout approved successfully",
            "payout_id": payout.id,
            "transaction_hash": payout.transaction_hash
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/payouts/{payout_id}/reject")
async def reject_payout(
    payout_id: int,
    reason: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Відхилити виплату та повернути баланс креатору.
    """
    service = CreatorAdminService(db)

    try:
        payout = await service.reject_payout(payout_id, reason)
        return {
            "message": "Payout rejected and balance refunded",
            "payout_id": payout.id,
            "reason": reason
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Statistics & Lists ============

@router.get("/list", response_model=List[admin_schemas.CreatorListResponse])
async def get_creators_list(
    limit: int = 100,
    offset: int = 0,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати список всіх креаторів з статистикою.
    """
    service = CreatorAdminService(db)
    return await service.get_creators_list(limit, offset)


@router.get("/stats/moderation")
async def get_moderation_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Статистика модерації маркетплейсу.

    Показує кількість заявок, товарів та виплат на розгляді.
    """
    service = CreatorAdminService(db)
    return await service.get_moderation_stats()


@router.get("/stats/commissions")
async def get_commission_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Статистика комісій платформи від продажів креаторів.

    Показує загальну суму комісій, продажів та середню комісію з продажу.
    """
    service = CreatorAdminService(db)
    return await service.get_commission_stats()
