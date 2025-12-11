from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, String, and_, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import aiofiles
from pathlib import Path
import logging
import os
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.users.dependencies import get_current_admin_user
from app.users.models import User
from app.products.models import Product, Category, CategoryTranslation
from app.orders.models import Order, OrderItem, PromoCode
from app.subscriptions.models import Subscription
from app.admin.schemas import (
    DashboardStats, UserListResponse, CategoryResponse,
    PromoCodeCreate, PromoCodeResponse, OrderListResponse,
    FileUploadResponse, UserDetailResponse, SubscriptionForUser,
    OrderForUser, ReferralForUser, OrderDetailResponse, ProductInOrder, UserBrief,
    PromoCodeDetailResponse, PromoCodeUpdate, OrderForPromoCode
)
from app.core.telegram_service import telegram_service
from app.core.translations import get_text

router = APIRouter(tags=["Admin"])
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(settings.UPLOAD_PATH)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "images").mkdir(exist_ok=True)
(UPLOAD_DIR / "archives").mkdir(exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
}

ALLOWED_ARCHIVE_TYPES = {
    "application/zip": ".zip",
    "application/x-rar-compressed": ".rar",
    "application/x-7z-compressed": ".7z",
    "application/octet-stream": ".zip"
}


async def save_upload_file(
        upload_file: UploadFile,
        destination: Path,
        old_file_path: Optional[str] = None
) -> tuple[str, float]:
    if old_file_path:
        old_path = Path(settings.UPLOAD_PATH) / old_file_path.lstrip('/')
        if old_path.exists():
            try:
                old_path.unlink()
                logger.info(f"Видалено старий файл: {old_path}")
            except Exception as e:
                logger.error(f"Помилка видалення файлу {old_path}: {e}")

    destination.parent.mkdir(parents=True, exist_ok=True)
    file_size = 0

    try:
        async with aiofiles.open(destination, 'wb') as out_file:
            while content := await upload_file.read(1024 * 1024):
                await out_file.write(content)
                file_size += len(content)

        file_size_mb = round(file_size / (1024 * 1024), 2)
        logger.info(f"Збережено файл: {destination} ({file_size_mb} MB)")

        return str(destination.relative_to(Path(settings.UPLOAD_PATH))), file_size_mb

    except Exception as e:
        logger.error(f"Помилка збереження файлу {upload_file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=get_text("admin_upload_error_save", "uk", error=str(e))
        )


def generate_unique_filename(original_filename: str, extension: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    base_name, _ = os.path.splitext(original_filename)
    safe_name = "".join(c for c in base_name if c.isalnum() or c in "._-")[:50]
    if not safe_name.endswith(extension):
        return f"{timestamp}_{unique_id}_{safe_name}{extension}"
    return f"{timestamp}_{unique_id}_{safe_name}"


@router.post("/upload/image", response_model=FileUploadResponse)
async def upload_image(
        file: UploadFile = File(...),
        old_path: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_type_image", "uk", allowed=', '.join(ALLOWED_IMAGE_TYPES.keys()))
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    unique_filename = generate_unique_filename(file.filename, extension)
    file_path = UPLOAD_DIR / "images" / unique_filename

    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    file_url = f"/uploads/{relative_path}"

    return FileUploadResponse(
        file_path=file_url,
        file_size_mb=file_size_mb,
        filename=unique_filename
    )


@router.post("/upload/archive", response_model=FileUploadResponse)
async def upload_archive(
        file: UploadFile = File(...),
        old_path: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user)
):
    _, extension = os.path.splitext(file.filename)
    if extension not in [".zip", ".rar", ".7z"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_type_archive", "uk", allowed=".zip, .rar, .7z")
        )

    unique_filename = generate_unique_filename(file.filename, extension)
    file_path = UPLOAD_DIR / "archives" / unique_filename

    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    file_url = f"/uploads/{relative_path}"

    return FileUploadResponse(
        file_path=file_url,
        file_size_mb=file_size_mb,
        filename=unique_filename
    )


@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    users_count = await db.scalar(select(func.count(User.id)))

    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_users = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )

    products_count = await db.scalar(select(func.count(Product.id)))

    active_subscriptions = await db.scalar(
        select(func.count(Subscription.id)).where(
            Subscription.status == "active",
            Subscription.end_date > datetime.now(timezone.utc)
        )
    )

    total_orders = await db.scalar(select(func.count(Order.id)))
    paid_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == "paid")
    )

    total_revenue = await db.scalar(
        select(func.sum(Order.final_total)).where(Order.status == "paid")
    ) or 0

    month_ago = datetime.now(timezone.utc) - timedelta(days=30)
    monthly_revenue = await db.scalar(
        select(func.sum(Order.final_total)).where(
            Order.status == "paid",
            Order.created_at >= month_ago
        )
    ) or 0

    return DashboardStats(
        users={
            "total": users_count,
            "new_this_week": new_users
        },
        products={
            "total": products_count
        },
        subscriptions={
            "active": active_subscriptions
        },
        orders={
            "total": total_orders,
            "paid": paid_orders,
            "conversion_rate": round((paid_orders / total_orders * 100) if total_orders > 0 else 0, 2)
        },
        revenue={
            "total": float(total_revenue),
            "monthly": float(monthly_revenue)
        }
    )


@router.get("/users", response_model=UserListResponse, tags=["Admin Users"])
async def get_users(
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(User)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                func.coalesce(User.username, '').ilike(search_term),
                func.coalesce(User.first_name, '').ilike(search_term),
                func.coalesce(User.last_name, '').ilike(search_term),
                func.coalesce(User.email, '').ilike(search_term),
                User.telegram_id.cast(String).ilike(search_term)
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    query = query.offset(skip).limit(limit).order_by(User.id.asc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse, tags=["Admin Users"])
async def get_user_details(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(User)
        .options(
            joinedload(User.referrals),
            selectinload(User.subscriptions),
            selectinload(User.orders).selectinload(Order.items)
        )
        .where(User.id == user_id)
    )

    result = await db.execute(query)
    user = result.unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail=get_text("admin_user_not_found", "uk"))

    user_data = UserDetailResponse.model_validate(user)

    user_data.subscriptions = [
        SubscriptionForUser.model_validate(sub) for sub in user.subscriptions
    ]
    user_data.orders = [
        OrderForUser(
            id=order.id,
            final_total=float(order.final_total),
            status=order.status.value,
            created_at=order.created_at,
            items_count=len(order.items)
        ) for order in user.orders
    ]
    user_data.referrals = [
        ReferralForUser.model_validate(ref) for ref in user.referrals
    ]

    return user_data


@router.patch("/users/{user_id}/toggle-admin", tags=["Admin Users"])
async def toggle_user_admin(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail=get_text("admin_user_error_self_admin", "uk")
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=get_text("admin_user_not_found", "uk"))

    user.is_admin = not user.is_admin
    await db.commit()

    return {
        "success": True,
        "user_id": user_id,
        "is_admin": user.is_admin
    }


@router.patch("/users/{user_id}/toggle-active", tags=["Admin Users"])
async def toggle_user_active(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail=get_text("admin_user_error_self_block", "uk")
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=get_text("admin_user_not_found", "uk"))

    if not hasattr(user, 'is_active'):
        user.is_active = True

    user.is_active = not user.is_active
    await db.commit()

    return {
        "success": True,
        "user_id": user_id,
        "is_active": user.is_active
    }


@router.post("/users/{user_id}/add-bonus", tags=["Admin Users"])
async def add_user_bonus(
        user_id: int,
        amount: int = Form(...),
        reason: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=get_text("admin_user_not_found", "uk"))

    user.bonus_balance += amount
    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin {admin.id} added {amount} bonuses to user {user_id}. Reason: {reason}")

    try:
        lang = user.language_code or "uk"
        msg = get_text("admin_bonus_msg_title", lang, amount=amount)
        if reason:
            msg += get_text("admin_bonus_msg_comment", lang, reason=reason)
        msg += get_text("admin_bonus_msg_balance", lang, balance=user.bonus_balance)
        await telegram_service.send_message(user.telegram_id, msg)
    except Exception as e:
        logger.error(f"Failed to send bonus notification: {e}")

    return {
        "success": True,
        "user_id": user_id,
        "new_balance": user.bonus_balance,
        "added": amount,
        "reason": reason
    }


@router.post("/users/{user_id}/subscription", tags=["Admin Users"])
async def give_user_subscription(
        user_id: int,
        days: int = Body(..., embed=True),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=get_text("admin_user_not_found", "uk"))

    from datetime import datetime, timedelta, timezone
    from app.subscriptions.models import Subscription

    existing = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        )
    )
    subscription = existing.scalar_one_or_none()

    if subscription:
        if subscription.end_date < datetime.now(timezone.utc):
            subscription.end_date = datetime.now(timezone.utc) + timedelta(days=days)
        else:
            subscription.end_date += timedelta(days=days)
    else:
        subscription = Subscription(
            user_id=user_id,
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=days),
            status="active"
        )
        db.add(subscription)

    await db.commit()

    try:
        lang = user.language_code or "uk"
        date_str = subscription.end_date.strftime("%d.%m.%Y")
        msg = get_text("admin_sub_msg_title", lang, days=days, date_str=date_str)
        await telegram_service.send_message(user.telegram_id, msg)
    except Exception as e:
        logger.error(f"Failed to send subscription notification: {e}")

    return {
        "success": True,
        "message": get_text("admin_sub_success_response", "uk", days=days, name=user.first_name),
        "end_date": subscription.end_date.isoformat()
    }


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).options(selectinload(Category.translations))
    )
    categories = result.scalars().unique().all()

    return [
        CategoryResponse(
            id=cat.id,
            slug=cat.slug,
            name=next((t.name for t in cat.translations if t.language_code == 'uk'), cat.slug)
        )
        for cat in categories
    ]


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
        name: str = Form(...),
        slug: str = Form(...),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(Category).where(Category.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=get_text("admin_category_error_slug_exists", "uk")
        )

    category = Category(slug=slug)
    db.add(category)
    await db.flush()

    translation = CategoryTranslation(
        category_id=category.id,
        language_code='uk',
        name=name
    )
    db.add(translation)

    await db.commit()
    await db.refresh(category)

    return CategoryResponse(
        id=category.id,
        slug=category.slug,
        name=name
    )


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
        category_id: int,
        name: Optional[str] = Form(None),
        slug: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail=get_text("admin_category_not_found", "uk"))

    if slug:
        category.slug = slug

    if name:
        result = await db.execute(
            select(CategoryTranslation).where(
                and_(
                    CategoryTranslation.category_id == category_id,
                    CategoryTranslation.language_code == 'uk'
                )
            )
        )
        translation = result.scalar_one_or_none()

        if translation:
            translation.name = name
        else:
            translation = CategoryTranslation(
                category_id=category_id,
                language_code='uk',
                name=name
            )
            db.add(translation)

    await db.commit()
    await db.refresh(category)

    return CategoryResponse(
        id=category.id,
        slug=category.slug,
        name=name or category.slug
    )


@router.delete("/categories/{category_id}")
async def delete_category(
        category_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail=get_text("admin_category_not_found", "uk"))

    await db.delete(category)
    await db.commit()

    return {"success": True, "message": get_text("admin_category_deleted", "uk")}


@router.get("/promo-codes", response_model=List[PromoCodeResponse])
async def get_promo_codes(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PromoCode).order_by(PromoCode.created_at.desc())
    )
    promo_codes = result.scalars().all()

    return [
        PromoCodeResponse.model_validate(promo)
        for promo in promo_codes
    ]


@router.get("/promo-codes/{promo_id}", response_model=PromoCodeDetailResponse)
async def get_promo_code_details(
        promo_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(PromoCode)
        .options(selectinload(PromoCode.orders_used_in).selectinload(Order.user))
        .where(PromoCode.id == promo_id)
    )
    result = await db.execute(query)
    promo = result.unique().scalar_one_or_none()

    if not promo:
        raise HTTPException(status_code=404, detail=get_text("admin_promo_not_found", "uk"))

    response_data = PromoCodeDetailResponse.model_validate(promo)
    response_data.orders_used_in = [
        OrderForPromoCode(
            id=order.id,
            final_total=float(order.final_total),
            created_at=order.created_at,
            user=UserBrief.model_validate(order.user)
        )
        for order in promo.orders_used_in
    ]

    return response_data


@router.post("/promo-codes", response_model=PromoCodeResponse)
async def create_promo_code(
        data: PromoCodeCreate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(PromoCode).where(PromoCode.code == data.code.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail=get_text("admin_promo_error_code_exists", "uk")
        )

    promo = PromoCode(
        code=data.code.upper(),
        discount_type=data.discount_type,
        value=data.value,
        max_uses=data.max_uses,
        expires_at=data.expires_at,
        is_active=True,
        current_uses=0
    )

    db.add(promo)
    await db.commit()
    await db.refresh(promo)

    return PromoCodeResponse.model_validate(promo)


@router.put("/promo-codes/{promo_id}", response_model=PromoCodeResponse)
async def update_promo_code(
        promo_id: int,
        data: PromoCodeUpdate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail=get_text("admin_promo_not_found", "uk"))

    update_data = data.model_dump(exclude_unset=True)
    if 'code' in update_data:
        update_data['code'] = update_data['code'].upper()

    for key, value in update_data.items():
        setattr(promo, key, value)

    await db.commit()
    await db.refresh(promo)

    return PromoCodeResponse.model_validate(promo)


@router.patch("/promo-codes/{promo_id}/toggle")
async def toggle_promo_code(
        promo_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail=get_text("admin_promo_not_found", "uk"))

    promo.is_active = not promo.is_active
    await db.commit()

    return {
        "success": True,
        "promo_id": promo_id,
        "is_active": promo.is_active
    }


@router.delete("/promo-codes/{promo_id}")
async def delete_promo_code(
        promo_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail=get_text("admin_promo_not_found", "uk"))

    await db.delete(promo)
    await db.commit()

    return {"success": True, "message": get_text("admin_promo_deleted", "uk")}


@router.get("/orders", response_model=OrderListResponse)
async def get_orders(
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(
        selectinload(Order.user),
        selectinload(Order.items)
    )

    if status:
        query = query.where(Order.status == status)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().unique().all()

    orders_data = []
    for order in orders:
        orders_data.append({
            "id": order.id,
            "user": {
                "id": order.user.id,
                "username": order.user.username,
                "first_name": order.user.first_name
            },
            "subtotal": float(order.subtotal),
            "discount_amount": float(order.discount_amount),
            "final_total": float(order.final_total),
            "status": order.status.value if hasattr(order.status, 'value') else order.status,
            "items_count": len(order.items),
            "created_at": order.created_at.isoformat()
        })

    return OrderListResponse(
        orders=orders_data,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/orders/{order_id}", response_model=OrderDetailResponse)
async def get_order_details(
        order_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(Order)
        .options(
            selectinload(Order.user),
            selectinload(Order.promo_code),
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.translations)
        )
        .where(Order.id == order_id)
    )
    result = await db.execute(query)
    order = result.unique().scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail=get_text("admin_order_not_found", "uk"))

    items_data = []
    for item in order.items:
        translation = item.product.get_translation('uk')
        items_data.append(
            ProductInOrder(
                id=item.product.id,
                title=translation.title if translation else get_text("admin_order_item_title_fallback", "uk"),
                price_at_purchase=float(item.price_at_purchase),
                main_image_url=item.product.main_image_url
            )
        )

    order_details = OrderDetailResponse(
        id=order.id,
        user=UserBrief.model_validate(order.user),
        subtotal=float(order.subtotal),
        discount_amount=float(order.discount_amount),
        bonus_used=order.bonus_used,
        final_total=float(order.final_total),
        status=order.status.value,
        promo_code=PromoCodeResponse.model_validate(order.promo_code) if order.promo_code else None,
        payment_url=order.payment_url,
        payment_id=order.payment_id,
        created_at=order.created_at,
        paid_at=order.paid_at,
        items=items_data
    )

    return order_details


@router.patch("/orders/{order_id}/status")
async def update_order_status(
        order_id: int,
        status: str = Form(...),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail=get_text("admin_order_not_found", "uk"))

    valid_statuses = ["pending", "paid", "failed"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=get_text("admin_order_error_status_invalid", "uk", allowed=', '.join(valid_statuses))
        )

    order.status = status

    if status == "paid" and not order.paid_at:
        order.paid_at = datetime.now(timezone.utc)

    await db.commit()

    return {
        "success": True,
        "order_id": order_id,
        "new_status": status
    }


@router.get("/export/users")
async def export_users_csv(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    import csv
    import io
    from fastapi.responses import StreamingResponse

    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        'ID', 'Telegram ID', 'Username', 'First Name', 'Last Name',
        'Email', 'Is Admin', 'Bonus Balance', 'Created At'
    ])

    for user in users:
        writer.writerow([
            user.id,
            user.telegram_id,
            user.username or '',
            user.first_name,
            user.last_name or '',
            user.email or '',
            'Yes' if user.is_admin else 'No',
            user.bonus_balance,
            user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else ''
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type='text/csv',
        headers={
            "Content-Disposition": f"attachment; filename=users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )