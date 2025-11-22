from fastapi import APIRouter, Depends, Header, HTTPException, status, Body
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import date, datetime
from pathlib import Path
import logging

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.products.models import Product, ProductTranslation, ProductType
from app.subscriptions.models import UserProductAccess
from app.profile.schemas import DownloadsResponse, DownloadableProduct
from app.users.schemas import UserResponse, UserUpdate, BonusClaimResponse, TelegramAuthData
from app.users.auth_service import AuthService
from app.core.config import settings
from app.bonuses.service import BonusService
from app.referrals.models import ReferralLog
from app.referrals.schemas import ReferralInfoResponse, ReferralLogItem, ReferrerInfo

router = APIRouter(tags=["Profile"])
logger = logging.getLogger(__name__)


@router.post("/bonus/claim", response_model=BonusClaimResponse)
async def claim_daily_bonus(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    bonus_service = BonusService(db)
    result = await bonus_service.claim_daily_bonus(current_user.id)
    return result


@router.get("/bonus/info")
async def get_bonus_info(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    bonus_service = BonusService(db)
    info = await bonus_service.get_bonus_info(current_user.id)
    return info


@router.get("/favorites")
async def get_favorites(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    # TODO: Реалізувати після додавання таблиці favorites
    return {"message": "Coming soon"}


@router.get("/downloads")
async def get_my_downloads(
        current_user: User = Depends(get_current_user),
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):

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

    return UserResponse.from_orm(current_user)


@router.post("/me/telegram-sync", response_model=UserResponse)
async def sync_profile_with_telegram(
        auth_data: TelegramAuthData,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    auth_data_dict = auth_data.model_dump(exclude_unset=True)
    if not AuthService.verify_telegram_auth(auth_data_dict):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Telegram authentication data"
        )

    if auth_data.id != current_user.telegram_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telegram data does not match the current user"
        )

    update_fields = {
        'first_name': auth_data.first_name,
        'last_name': auth_data.last_name,
        'username': auth_data.username,
        'photo_url': auth_data.photo_url,
    }

    for field, value in update_fields.items():
        if value is not None:
            setattr(current_user, field, value)

    current_user.updated_at = datetime.utcnow()

    return UserResponse.from_orm(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):

    update_data = user_update.model_dump(exclude_unset=True)
    allowed_fields = ['email', 'phone']

    is_updated = False
    for field, value in update_data.items():
        if field in allowed_fields and hasattr(current_user, field):
            setattr(current_user, field, value)
            is_updated = True

    if is_updated:
        current_user.updated_at = datetime.utcnow()

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


def get_archive_media_type(filename: str) -> str:
    """Визначає MIME-тип на основі розширення файлу для кращої сумісності."""
    if filename.lower().endswith('.zip'):
        return 'application/zip'
    if filename.lower().endswith('.rar'):
        return 'application/vnd.rar'
    if filename.lower().endswith('.7z'):
        return 'application/x-7z-compressed'
    return 'application/octet-stream'


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
        logger.error(f"DOWNLOAD ERROR: Product record for ID {product_id} found, but zip_file_path is missing.")
        raise HTTPException(status_code=404, detail="Файл товару не знайдено в базі даних")

    relative_path = product.zip_file_path.removeprefix('/uploads/')
    file_path = Path(settings.UPLOAD_PATH) / relative_path

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail=f"Файл не знайдено на сервері за шляхом: {file_path}")

    product.downloads_count += 1
    await db.commit()
    media_type = get_archive_media_type(file_path.name)
    return FileResponse(str(file_path), filename=file_path.name, media_type=media_type)


@router.get("/referrals", response_model=ReferralInfoResponse)
async def get_referral_info(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    # Завантажуємо користувача разом з рефералами ТА ТИМ, ХТО ЙОГО ЗАПРОСИВ (referrer)
    user_query = select(User).options(
        selectinload(User.referrals),
        selectinload(User.referrer)  # <--- Додано
    ).where(User.id == current_user.id)

    user_res = await db.execute(user_query)
    user = user_res.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logs_query = await db.execute(
        select(ReferralLog)
        .options(selectinload(ReferralLog.referred_user))
        .where(ReferralLog.referrer_id == user.id)
        .order_by(ReferralLog.created_at.desc())
    )
    logs = logs_query.scalars().unique().all()

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

    total_bonuses = sum(log.bonus_amount for log in logs)

    # Формуємо інформацію про того, хто запросив
    referrer_info = None
    if user.referrer:
        referrer_info = ReferrerInfo(
            first_name=user.referrer.first_name,
            last_name=user.referrer.last_name,
            username=user.referrer.username
        )

    return ReferralInfoResponse(
        referral_code=user.referral_code,
        total_referrals=len(user.referrals),
        total_bonuses_earned=total_bonuses,
        logs=formatted_logs,
        referrer=referrer_info  # <--- Передаємо на фронт
    )