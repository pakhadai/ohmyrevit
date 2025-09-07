# ЗАМІНА БЕЗ ВИДАЛЕНЬ: старі рядки — закоментовано, нові — додано нижче
# backend/app/profile/router.py
from fastapi import APIRouter, Depends, Header, HTTPException, status, Body
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime
from pathlib import Path

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.products.models import Product, ProductType
from app.subscriptions.models import UserProductAccess
from app.profile.schemas import DownloadableProduct
from app.users.schemas import UserResponse, UserUpdate
from app.users.auth_service import AuthService
from app.core.config import settings
from app.bonuses.service import BonusService
from app.referrals.models import ReferralLog
from app.referrals.schemas import ReferralInfoResponse, ReferralLogItem
from app.collections.router import router as collections_router

router = APIRouter()

# Включаємо роутер колекцій сюди, щоб шляхи були /profile/collections
router.include_router(collections_router)


@router.post("/bonus/claim")
async def claim_daily_bonus(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання щоденного бонусу
    """
    bonus_service = BonusService(db)
    result = await bonus_service.claim_daily_bonus(current_user.id)
    return result


@router.get("/bonus/info")
async def get_bonus_info(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Інформація про бонусний статус користувача
    """
    bonus_service = BonusService(db)
    info = await bonus_service.get_bonus_info(current_user.id)
    return info


@router.get("/downloads")
async def get_my_downloads(
        current_user: User = Depends(get_current_user),
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку товарів, доступних для завантаження, розділених на преміум та безкоштовні.
    """
    language_code = accept_language.split(",")[0].split("-")[0].lower()
    if language_code not in ["uk", "en", "ru"]:
        language_code = "uk"

    # --- 1. Отримати всі безкоштовні товари ---
    free_products_query = await db.execute(
        select(Product).where(Product.product_type == ProductType.FREE).options(selectinload(Product.translations))
    )
    free_products_list = []
    for product in free_products_query.scalars().unique().all():
        translation = product.get_translation(language_code)
        if translation:
            free_products_list.append(DownloadableProduct(
                id=product.id,
                title=translation.title,
                description=translation.description,
                main_image_url=product.main_image_url,
                zip_file_path=product.zip_file_path or ""
            ))

    # --- 2. Отримати преміум товари, до яких надано доступ (куплені або за підпискою) ---
    accessible_premium_query = await db.execute(
        select(UserProductAccess.product_id).where(UserProductAccess.user_id == current_user.id)
    )
    all_premium_accessible_ids = accessible_premium_query.scalars().all()

    premium_products_list = []
    if all_premium_accessible_ids:
        products_result = await db.execute(
            select(Product).where(Product.id.in_(all_premium_accessible_ids)).options(
                selectinload(Product.translations))
        )
        for product in products_result.scalars().unique().all():
            translation = product.get_translation(language_code)
            if translation:
                premium_products_list.append(DownloadableProduct(
                    id=product.id,
                    title=translation.title,
                    description=translation.description,
                    main_image_url=product.main_image_url,
                    zip_file_path=product.zip_file_path or ""
                ))

    return {
        "premium": premium_products_list,
        "free": free_products_list
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
        current_user: User = Depends(get_current_user)
):
    """
    Отримання профілю поточного користувача
    """
    return UserResponse.from_orm(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Оновлення профілю поточного користувача (тільки email та телефон)
    """
    update_data = user_update.model_dump(exclude_unset=True)
    allowed_fields = ['email', 'phone']

    is_updated = False
    for field, value in update_data.items():
        if field in allowed_fields and hasattr(current_user, field):
            setattr(current_user, field, value)
            is_updated = True

    if is_updated:
        current_user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.from_orm(current_user)


@router.post("/check-access", response_model=dict)
async def check_product_access(
        product_ids: List[int] = Body(..., embed=True),
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Перевіряє доступ поточного користувача до списку товарів."""
    accessible_ids = set()

    if not product_ids:
        return {"accessible_product_ids": []}

    # 1. Додаємо всі безкоштовні товари
    free_products = await db.execute(
        select(Product.id).where(Product.id.in_(product_ids), Product.product_type == ProductType.FREE)
    )
    accessible_ids.update(free_products.scalars().all())

    # 2. Перевіряємо куплені товари або надані по підписці
    granted_access = await db.execute(
        select(UserProductAccess.product_id).where(
            UserProductAccess.user_id == current_user.id,
            UserProductAccess.product_id.in_(product_ids)
        )
    )
    accessible_ids.update(granted_access.scalars().all())

    return {"accessible_product_ids": list(accessible_ids)}


@router.get("/download/{product_id}")
async def download_product_file(
        product_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Віддає файл товару, якщо користувач має до нього доступ."""
    access_response = await check_product_access(product_ids=[product_id], current_user=current_user, db=db)
    if product_id not in access_response["accessible_product_ids"]:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    product = await db.get(Product, product_id)
    if not product or not product.zip_file_path:
        raise HTTPException(status_code=404, detail="Файл товару не знайдено")

    relative_path = product.zip_file_path.lstrip('/uploads/')
    file_path = Path(settings.UPLOAD_PATH) / relative_path

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Файл не знайдено на сервері")

    product.downloads_count += 1
    await db.commit()

    return FileResponse(str(file_path), filename=file_path.name, media_type='application/octet-stream')


@router.get("/referrals", response_model=ReferralInfoResponse)
async def get_referral_info(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Отримання інформації для реферальної сторінки."""

    logs_query = await db.execute(
        select(ReferralLog)
        .options(selectinload(ReferralLog.referred_user))
        .where(ReferralLog.referrer_id == current_user.id)
        .order_by(ReferralLog.created_at.desc())
    )
    logs = logs_query.scalars().unique().all()

    total_referrals = len(set(log.referred_user_id for log in logs))
    total_bonuses_earned = sum(log.bonus_amount for log in logs)

    formatted_logs = [
        ReferralLogItem(
            referred_user_name=log.referred_user.first_name if log.referred_user else "Користувач",
            bonus_type=log.bonus_type.value,
            bonus_amount=log.bonus_amount,
            purchase_amount=float(log.purchase_amount) if log.purchase_amount else None,
            created_at=log.created_at
        )
        for log in logs
    ]

    return ReferralInfoResponse(
        referral_code=current_user.referral_code,
        total_referrals=total_referrals,
        total_bonuses_earned=total_bonuses_earned,
        logs=formatted_logs
    )