from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.core.config import settings
from app.creators.service import CreatorService
from app.creators import schemas


router = APIRouter(prefix="/creators", tags=["Creators"])


# Dependency для перевірки чи marketplace увімкнений
def check_marketplace_enabled():
    if not settings.MARKETPLACE_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace feature is currently disabled"
        )


# ============ Creator Application Endpoints ============

@router.post("/apply", response_model=schemas.CreatorApplicationResponse, dependencies=[Depends(check_marketplace_enabled)])
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


@router.post("/products/{product_id}/submit", dependencies=[Depends(check_marketplace_enabled)])
async def submit_product_for_moderation(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Відправити товар на модерацію"""
    service = CreatorService(db)

    try:
        product = await service.submit_product_for_moderation(product_id, current_user.id)
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
