from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.core.config import settings
from app.creators.service import CreatorService
from app.creators import schemas
from app.core.email import email_service
from app.core.telegram_service import telegram_service
import logging

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/creators", tags=["Creators"])


# Dependency для перевірки чи marketplace увімкнений
def check_marketplace_enabled():
    if not settings.MARKETPLACE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace feature is currently disabled"
        )


# ============ Creator Application Endpoints ============

@router.post(
    "/apply",
    response_model=schemas.CreatorApplicationResponse,
    dependencies=[Depends(check_marketplace_enabled)]
)
async def apply_to_become_creator(
    data: schemas.CreatorApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Подати заявку на статус креатора.

    Потрібно вказати посилання на портфоліо та мотиваційний лист.
    """
    service = CreatorService(db)

    try:
        application = await service.create_application(
            user_id=current_user.id,
            portfolio_url=data.portfolio_url,
            motivation=data.motivation
        )

        # Відправити нотифікацію адміну про нову заявку
        if settings.ADMIN_EMAIL:
            try:
                await email_service.send_admin_new_application(
                    admin_email=settings.ADMIN_EMAIL,
                    user_id=current_user.id,
                    username=current_user.username or f"user_{current_user.id}",
                    language_code="uk"
                )
            except Exception as e:
                logger.error(f"Failed to send admin email: {e}")

        if settings.ADMIN_TELEGRAM_ID and current_user.telegram_id:
            try:
                await telegram_service.notify_admin_new_application(
                    chat_id=settings.ADMIN_TELEGRAM_ID,
                    user_id=current_user.id,
                    username=current_user.username or f"user_{current_user.id}"
                )
            except Exception as e:
                logger.error(f"Failed to send admin Telegram: {e}")

        return application
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/status", response_model=schemas.CreatorStatusResponse, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримати статус креатора (чи є креатором, чи є заявка на розгляді)"""
    service = CreatorService(db)
    return await service.get_creator_status(current_user.id)


# ============ Creator Balance & Payouts ============

@router.get("/balance", response_model=schemas.CreatorBalanceResponse, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_balance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати баланс креатора та статистику заробітку.

    Доступно тільки для користувачів зі статусом креатора.
    """
    service = CreatorService(db)

    try:
        return await service.get_creator_balance_info(current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post("/payouts/request", response_model=schemas.PayoutResponse, dependencies=[Depends(check_marketplace_enabled)])
async def request_payout(
    data: schemas.PayoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Створити запит на виплату в USDT.

    Мінімальна сума: ${settings.MIN_PAYOUT_AMOUNT_USD}
    Підтримувані мережі: TRC20, ERC20, BEP20
    """
    service = CreatorService(db)

    try:
        payout = await service.request_payout(
            user_id=current_user.id,
            amount_coins=data.amount_coins,
            usdt_address=data.usdt_address,
            usdt_network=data.usdt_network
        )
        return payout
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Creator Transactions ============

@router.get("/transactions", response_model=List[schemas.CreatorTransactionResponse], dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_transactions(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати історію транзакцій креатора.

    Показує всі продажі, комісії, виплати та повернення.
    """
    service = CreatorService(db)
    transactions = await service.get_creator_transactions(current_user.id, limit, offset)
    return transactions


# ============ Creator Products Management ============

@router.post("/products", response_model=schemas.CreatorProductResponse, dependencies=[Depends(check_marketplace_enabled)])
async def create_product(
    product_data: schemas.CreatorProductCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Створити новий товар креатора.

    Товар створюється зі статусом DRAFT. Для публікації потрібно відправити на модерацію.
    """
    service = CreatorService(db)

    try:
        product = await service.create_creator_product(
            creator_id=current_user.id,
            product_data=product_data.model_dump()
        )

        # Формуємо відповідь
        translation = product.get_translation("uk")
        return schemas.CreatorProductResponse(
            id=product.id,
            title=translation.title if translation else "Untitled",
            description=translation.description if translation else "",
            price=float(product.price),
            author_id=product.author_id,
            moderation_status=product.moderation_status.value,
            rejection_reason=product.rejection_reason,
            main_image_url=product.main_image_url,
            gallery_image_urls=product.gallery_image_urls or [],
            zip_file_path=product.zip_file_path,
            file_size_mb=float(product.file_size_mb),
            compatibility=product.compatibility,
            views_count=product.views_count,
            downloads_count=product.downloads_count,
            created_at=product.created_at,
            updated_at=product.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/products", response_model=List[schemas.CreatorProductResponse], dependencies=[Depends(check_marketplace_enabled)])
async def get_my_products(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримати всі товари креатора"""
    service = CreatorService(db)

    try:
        products = await service.get_creator_products(current_user.id, limit, offset)

        result = []
        for product in products:
            translation = product.get_translation("uk")
            result.append(schemas.CreatorProductResponse(
                id=product.id,
                title=translation.title if translation else "Untitled",
                description=translation.description if translation else "",
                price=float(product.price),
                author_id=product.author_id,
                moderation_status=product.moderation_status.value,
                rejection_reason=product.rejection_reason,
                main_image_url=product.main_image_url,
                gallery_image_urls=product.gallery_image_urls or [],
                zip_file_path=product.zip_file_path,
                file_size_mb=float(product.file_size_mb),
                compatibility=product.compatibility,
                views_count=product.views_count,
                downloads_count=product.downloads_count,
                created_at=product.created_at,
                updated_at=product.updated_at
            ))

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.put("/products/{product_id}", response_model=schemas.CreatorProductResponse, dependencies=[Depends(check_marketplace_enabled)])
async def update_product(
    product_id: int,
    update_data: schemas.CreatorProductUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Оновити товар креатора (тільки DRAFT або REJECTED)"""
    service = CreatorService(db)

    try:
        product = await service.update_creator_product(
            product_id=product_id,
            creator_id=current_user.id,
            update_data=update_data.model_dump(exclude_unset=True)
        )

        translation = product.get_translation("uk")
        return schemas.CreatorProductResponse(
            id=product.id,
            title=translation.title if translation else "Untitled",
            description=translation.description if translation else "",
            price=float(product.price),
            author_id=product.author_id,
            moderation_status=product.moderation_status.value,
            rejection_reason=product.rejection_reason,
            main_image_url=product.main_image_url,
            gallery_image_urls=product.gallery_image_urls or [],
            zip_file_path=product.zip_file_path,
            file_size_mb=float(product.file_size_mb),
            compatibility=product.compatibility,
            views_count=product.views_count,
            downloads_count=product.downloads_count,
            created_at=product.created_at,
            updated_at=product.updated_at
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/products/{product_id}/submit",
    dependencies=[Depends(check_marketplace_enabled)]
)
async def submit_product_for_moderation(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Відправити товар на модерацію"""
    service = CreatorService(db)

    try:
        product = await service.submit_product_for_moderation(
            product_id, current_user.id
        )

        # Отримати переклад товару для нотифікації
        translation = product.get_translation("uk")
        product_title = translation.title if translation else "Untitled"

        # Відправити нотифікацію адміну про новий товар на модерації
        if settings.ADMIN_EMAIL:
            try:
                await email_service.send_admin_new_product_moderation(
                    admin_email=settings.ADMIN_EMAIL,
                    product_title=product_title,
                    author_username=current_user.username or f"user_{current_user.id}",
                    product_id=product.id,
                    language_code="uk"
                )
            except Exception as e:
                logger.error(f"Failed to send admin email: {e}")

        if settings.ADMIN_TELEGRAM_ID:
            try:
                await telegram_service.notify_admin_new_product_moderation(
                    chat_id=settings.ADMIN_TELEGRAM_ID,
                    product_title=product_title,
                    author_username=current_user.username or f"user_{current_user.id}",
                    product_id=product.id
                )
            except Exception as e:
                logger.error(f"Failed to send admin Telegram: {e}")

        return {
            "message": "Product submitted for moderation",
            "product_id": product.id,
            "status": product.moderation_status.value
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/products/{product_id}", dependencies=[Depends(check_marketplace_enabled)])
async def delete_product(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалити товар (тільки DRAFT)"""
    service = CreatorService(db)

    try:
        await service.delete_creator_product(product_id, current_user.id)
        return {"message": "Product deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ============ Creator Stats ============

@router.get("/stats/products", response_model=schemas.CreatorProductStats, dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_product_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати статистику товарів креатора.

    Показує кількість товарів за статусами, продажі та дохід.
    """
    service = CreatorService(db)
    return await service.get_creator_product_stats(current_user.id)


# ============ Public Creator Profile ============

@router.get("/{creator_id}/profile", dependencies=[Depends(check_marketplace_enabled)])
async def get_creator_public_profile(
    creator_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати публічний профіль креатора.

    Показує інформацію про креатора та його товари.
    Доступно для всіх користувачів (не потрібна авторизація).
    """
    from sqlalchemy import select, func
    from app.products.models import Product, ProductModerationStatus

    # Отримуємо користувача
    result = await db.execute(select(User).where(User.id == creator_id))
    creator = result.scalar_one_or_none()

    if not creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found"
        )

    if not creator.is_creator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a creator"
        )

    # Отримуємо схвалені товари креатора
    products_query = select(Product).where(
        Product.author_id == creator_id,
        Product.moderation_status == ProductModerationStatus.APPROVED
    )
    products_result = await db.execute(products_query)
    products = products_result.scalars().all()

    # Підраховуємо статистику
    total_products = len(products)
    total_views = sum(p.views_count for p in products)
    total_downloads = sum(p.downloads_count for p in products)

    # Формуємо список товарів
    products_list = []
    for product in products:
        translation = product.get_translation("uk")
        products_list.append({
            "id": product.id,
            "title": translation.title if translation else "Untitled",
            "description": translation.description[:200] + "..." if translation else "",
            "price": float(product.price),
            "main_image_url": product.main_image_url,
            "views_count": product.views_count,
            "downloads_count": product.downloads_count,
            "file_size_mb": float(product.file_size_mb),
            "compatibility": product.compatibility,
            "created_at": product.created_at.isoformat() if product.created_at else None
        })

    return {
        "creator_id": creator.id,
        "username": creator.username or f"user_{creator.id}",
        "full_name": creator.full_name,
        "created_at": creator.created_at.isoformat() if creator.created_at else None,
        "total_products": total_products,
        "total_views": total_views,
        "total_downloads": total_downloads,
        "products": products_list
    }
