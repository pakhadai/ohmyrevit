from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import date, datetime

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.products.models import Product, ProductTranslation
from app.subscriptions.models import UserProductAccess, Subscription, SubscriptionStatus
from app.profile.schemas import DownloadsResponse, DownloadableProduct
# ДОДАНО: імпорт TelegramAuthData та AuthService
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


@router.get("/downloads", response_model=DownloadsResponse)
async def get_my_downloads(
        current_user: User = Depends(get_current_user),
        accept_language: Optional[str] = Header(default="uk"),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку товарів, доступних для завантаження.
    Включає куплені товари та преміум-товари за активною підпискою.
    """
    language_code = accept_language.split(",")[0].split("-")[0].lower()
    if language_code not in ["uk", "en", "ru"]:
        language_code = "uk"

    # 1. Отримати всі товари, куплені напряму
    purchased_access = await db.execute(
        select(UserProductAccess.product_id).where(
            UserProductAccess.user_id == current_user.id,
            UserProductAccess.access_type == 'purchase'
        )
    )
    purchased_product_ids = purchased_access.scalars().all()

    # 2. Перевірити наявність активної підписки
    active_subscription = await db.execute(
        select(Subscription).where(
            Subscription.user_id == current_user.id,
            Subscription.status == SubscriptionStatus.ACTIVE,
            Subscription.end_date > datetime.utcnow()
        ).order_by(Subscription.start_date.desc()).limit(1)
    )
    subscription = active_subscription.scalar_one_or_none()

    subscription_product_ids = []
    if subscription:
        # 3. Якщо підписка активна, отримати всі преміум-товари, що вийшли під час її дії
        subscribed_products = await db.execute(
            select(Product.id).where(
                Product.product_type == 'premium',
                Product.created_at >= subscription.start_date
            )
        )
        subscription_product_ids = subscribed_products.scalars().all()

    # 4. Об'єднати ID та отримати унікальні
    all_accessible_ids = list(set(purchased_product_ids + subscription_product_ids))

    if not all_accessible_ids:
        return DownloadsResponse(products=[])

    # 5. Отримати інформацію про товари та їх переклади
    products_result = await db.execute(
        select(Product).where(Product.id.in_(all_accessible_ids))
    )

    result_products = []
    for product in products_result.scalars().all():
        translation = product.get_translation(language_code)
        if translation:
            result_products.append(DownloadableProduct(
                id=product.id,
                title=translation.title,
                main_image_url=product.main_image_url,
                zip_file_path=product.zip_file_path
            ))

    return DownloadsResponse(products=result_products)


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
        current_user: User = Depends(get_current_user)
):
    """
    Отримання профілю поточного користувача
    """
    return UserResponse.model_validate(current_user)


# ДОДАНО: Новий ендпоінт для синхронізації з Telegram
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


# ЗМІНЕНО: Ендпоінт тепер оновлює лише поля, не пов'язані з Telegram
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