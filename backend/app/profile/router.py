from fastapi import APIRouter, Depends, Header, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from datetime import date, datetime
from pathlib import Path

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.products.models import Product, ProductTranslation, ProductType
from app.subscriptions.models import UserProductAccess, Subscription, SubscriptionStatus
from app.profile.schemas import DownloadsResponse, DownloadableProduct
from app.users.schemas import UserResponse, UserUpdate, BonusClaimResponse, TelegramAuthData
from app.users.auth_service import AuthService
from app.core.config import settings
from app.bonuses.service import BonusService

router = APIRouter(tags=["Profile"])


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


@router.get("/favorites")
async def get_favorites(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку обраних товарів
    """
    # TODO: Реалізувати після додавання таблиці favorites
    return {"message": "Coming soon"}


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
        select(Product).where(Product.product_type == ProductType.FREE)
    )
    free_products_list = []
    for product in free_products_query.scalars().all():
        translation = product.get_translation(language_code)
        if translation:
            # OLD: free_products_list.append(DownloadableProduct(
            # OLD:     id=product.id,
            # OLD:     title=translation.title,
            # OLD:     main_image_url=product.main_image_url,
            # OLD:     zip_file_path=product.zip_file_path
            # OLD: ))
            free_products_list.append(DownloadableProduct(
                id=product.id,
                title=translation.title,
                description=translation.description,
                main_image_url=product.main_image_url,
                zip_file_path=product.zip_file_path
            ))

    # --- 2. Отримати преміум товари, до яких надано доступ (куплені або за підпискою) ---
    accessible_premium_query = await db.execute(
        select(UserProductAccess.product_id).where(UserProductAccess.user_id == current_user.id)
    )
    all_premium_accessible_ids = accessible_premium_query.scalars().all()

    premium_products_list = []
    if all_premium_accessible_ids:
        products_result = await db.execute(
            select(Product).where(Product.id.in_(all_premium_accessible_ids))
        )
        for product in products_result.scalars().all():
            translation = product.get_translation(language_code)
            if translation:
                # OLD: premium_products_list.append(DownloadableProduct(
                # OLD:     id=product.id,
                # OLD:     title=translation.title,
                # OLD:     main_image_url=product.main_image_url,
                # OLD:     zip_file_path=product.zip_file_path
                # OLD: ))
                premium_products_list.append(DownloadableProduct(
                    id=product.id,
                    title=translation.title,
                    description=translation.description,
                    main_image_url=product.main_image_url,
                    zip_file_path=product.zip_file_path
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
    return UserResponse.model_validate(current_user)


@router.post("/me/telegram-sync", response_model=UserResponse)
async def sync_profile_with_telegram(
        auth_data: TelegramAuthData,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Оновлює дані профілю (ім'я, юзернейм, фото) з даних Telegram
    """
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

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


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
        if field in allowed_fields:
            setattr(current_user, field, value)
            is_updated = True

    if is_updated:
        current_user.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/check-access")
async def check_product_access(
        product_ids: List[int],
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Перевіряє доступ поточного користувача до списку товарів."""
    accessible_ids = set()

    # 1. Додаємо всі безкоштовні товари
    free_products = await db.execute(
        select(Product.id).where(Product.id.in_(product_ids), Product.product_type == ProductType.FREE)
    )
    for pid in free_products.scalars().all():
        accessible_ids.add(pid)

    # 2. Перевіряємо куплені товари або надані по підписці
    granted_access = await db.execute(
        select(UserProductAccess.product_id).where(
            UserProductAccess.user_id == current_user.id,
            UserProductAccess.product_id.in_(product_ids)
        )
    )
    for pid in granted_access.scalars().all():
        accessible_ids.add(pid)


    return {"accessible_product_ids": list(accessible_ids)}


@router.get("/download/{product_id}")
async def download_product_file(
        product_id: int,
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
):
    """Віддає файл товару, якщо користувач має до нього доступ."""
    # Перевірка доступу
    access_response = await check_product_access([product_id], current_user, db)
    if product_id not in access_response["accessible_product_ids"]:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    # Отримуємо товар та шлях до файлу
    product = await db.get(Product, product_id)
    if not product or not product.zip_file_path:
        raise HTTPException(status_code=404, detail="Файл товару не знайдено")

    # Формуємо повний шлях до файлу
    # Видаляємо можливий префікс /uploads/ з шляху
    relative_path = product.zip_file_path.replace("/uploads/", "")
    file_path = Path(settings.UPLOAD_PATH) / relative_path

    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Файл не знайдено на сервері")

    # Збільшуємо лічильник завантажень
    product.downloads_count += 1
    await db.commit()

    return FileResponse(str(file_path), filename=file_path.name, media_type='application/octet-stream')