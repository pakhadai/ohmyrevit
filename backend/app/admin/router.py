"""
Головний роутер адмін-панелі з повною функціональністю
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, String, and_, or_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
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
from app.orders.models import Order, PromoCode
from app.subscriptions.models import Subscription
from app.admin.schemas import (
    DashboardStats, UserListResponse, CategoryResponse,
    PromoCodeCreate, PromoCodeResponse, OrderListResponse,
    FileUploadResponse
)

router = APIRouter(tags=["Admin"])
logger = logging.getLogger(__name__)

# Створюємо директорії для завантажень
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
    "application/octet-stream": ".zip"  # Для випадків коли MIME не визначений
}

# ========== УТИЛІТИ ==========

async def save_upload_file(
    upload_file: UploadFile,
    destination: Path,
    old_file_path: Optional[str] = None
) -> tuple[str, float]:
    """
    Зберігає файл та видаляє старий якщо він існує

    Returns:
        Tuple (шлях до файлу, розмір в MB)
    """
    # Видаляємо старий файл якщо він існує
    if old_file_path:
        old_path = Path(settings.UPLOAD_PATH) / old_file_path.lstrip('/')
        if old_path.exists():
            try:
                old_path.unlink()
                logger.info(f"Видалено старий файл: {old_path}")
            except Exception as e:
                logger.error(f"Помилка видалення файлу {old_path}: {e}")

    # Зберігаємо новий файл
    destination.parent.mkdir(parents=True, exist_ok=True)
    file_size = 0

    try:
        async with aiofiles.open(destination, 'wb') as out_file:
            while content := await upload_file.read(1024 * 1024):  # Читаємо по 1MB
                await out_file.write(content)
                file_size += len(content)

        file_size_mb = round(file_size / (1024 * 1024), 2)
        logger.info(f"Збережено файл: {destination} ({file_size_mb} MB)")

        return str(destination.relative_to(Path(settings.UPLOAD_PATH))), file_size_mb

    except Exception as e:
        logger.error(f"Помилка збереження файлу {upload_file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Не вдалося зберегти файл: {str(e)}"
        )

def generate_unique_filename(original_filename: str, extension: str) -> str:
    """Генерує унікальне ім'я файлу"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    safe_name = "".join(c for c in original_filename if c.isalnum() or c in "._-")[:50]
    return f"{timestamp}_{unique_id}_{safe_name}{extension}"

# ========== ЗАВАНТАЖЕННЯ ФАЙЛІВ ==========

@router.post("/upload/image", response_model=FileUploadResponse)
async def upload_image(
    file: UploadFile = File(...),
    old_path: Optional[str] = Form(None),
    admin: User = Depends(get_current_admin_user)
):
    """Завантаження зображення з видаленням старого"""

    # Перевірка типу файлу
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимий тип файлу. Дозволено: {', '.join(ALLOWED_IMAGE_TYPES.keys())}"
        )

    # Генеруємо унікальне ім'я
    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    unique_filename = generate_unique_filename(file.filename, extension)
    file_path = UPLOAD_DIR / "images" / unique_filename

    # Зберігаємо файл
    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    # Формуємо URL для доступу
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
    """Завантаження архіву з видаленням старого"""

    # Визначаємо розширення
    content_type = file.content_type or "application/octet-stream"

    # Спробуємо визначити розширення з імені файлу
    if content_type == "application/octet-stream" and file.filename:
        if file.filename.endswith('.zip'):
            extension = '.zip'
        elif file.filename.endswith('.rar'):
            extension = '.rar'
        elif file.filename.endswith('.7z'):
            extension = '.7z'
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не вдалося визначити тип архіву. Дозволено: .zip, .rar, .7z"
            )
    elif content_type in ALLOWED_ARCHIVE_TYPES:
        extension = ALLOWED_ARCHIVE_TYPES[content_type]
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недопустимий тип файлу. Дозволено архіви: .zip, .rar, .7z"
        )

    # Генеруємо унікальне ім'я
    unique_filename = generate_unique_filename(file.filename, extension)
    file_path = UPLOAD_DIR / "archives" / unique_filename

    # Зберігаємо файл
    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    # Формуємо URL
    file_url = f"/uploads/{relative_path}"

    return FileUploadResponse(
        file_path=file_url,
        file_size_mb=file_size_mb,
        filename=unique_filename
    )

# ========== DASHBOARD ==========

@router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання статистики для дашборду"""

    # Загальна кількість користувачів
    users_count = await db.scalar(select(func.count(User.id)))

    # Нові користувачі за тиждень
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )

    # Кількість товарів
    products_count = await db.scalar(select(func.count(Product.id)))

    # Активні підписки
    active_subscriptions = await db.scalar(
        select(func.count(Subscription.id)).where(
            Subscription.status == "active",
            Subscription.end_date > datetime.utcnow()
        )
    )

    # Статистика замовлень
    total_orders = await db.scalar(select(func.count(Order.id)))
    paid_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == "paid")
    )

    # Доходи
    total_revenue = await db.scalar(
        select(func.sum(Order.final_total)).where(Order.status == "paid")
    ) or 0

    month_ago = datetime.utcnow() - timedelta(days=30)
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

# ========== КОРИСТУВАЧІ ==========

@router.get("/users", response_model=UserListResponse)
async def get_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання списку користувачів"""

    query = select(User)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.username.ilike(search_term),
                User.first_name.ilike(search_term),
                User.telegram_id.cast(String).ilike(search_term)
            )
        )

    # Підрахунок загальної кількості
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Отримання користувачів з пагінацією
    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=users,
        total=total,
        skip=skip,
        limit=limit
    )

@router.patch("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Зміна статусу адміністратора"""

    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Не можна змінити власний статус адміністратора"
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    user.is_admin = not user.is_admin
    await db.commit()

    return {
        "success": True,
        "user_id": user_id,
        "is_admin": user.is_admin
    }

@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Блокування/розблокування користувача"""

    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Не можна заблокувати самого себе"
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Додаємо поле is_active якщо його немає
    if not hasattr(user, 'is_active'):
        user.is_active = True

    user.is_active = not user.is_active
    await db.commit()

    return {
        "success": True,
        "user_id": user_id,
        "is_active": user.is_active
    }

@router.post("/users/{user_id}/add-bonus")
async def add_user_bonus(
    user_id: int,
    amount: int = Form(...),
    reason: Optional[str] = Form(None),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Нарахування бонусів користувачу"""

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    user.bonus_balance += amount
    await db.commit()
    await db.refresh(user)

    logger.info(f"Admin {admin.id} added {amount} bonuses to user {user_id}. Reason: {reason}")

    return {
        "success": True,
        "user_id": user_id,
        "new_balance": user.bonus_balance,
        "added": amount,
        "reason": reason
    }


@router.post("/users/{user_id}/subscription")
async def give_user_subscription(
        user_id: int,
        days: int = Body(...),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Видача підписки користувачу"""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Створюємо або оновлюємо підписку
    from datetime import datetime, timedelta
    from app.subscriptions.models import Subscription

    existing = await db.execute(
        select(Subscription).where(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        )
    )
    subscription = existing.scalar_one_or_none()

    if subscription:
        # Продовжуємо існуючу
        subscription.end_date += timedelta(days=days)
    else:
        # Створюємо нову
        subscription = Subscription(
            user_id=user_id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=days),
            status="active"
        )
        db.add(subscription)

    await db.commit()

    return {
        "success": True,
        "message": f"Підписка на {days} днів видана користувачу {user.first_name}",
        "end_date": subscription.end_date.isoformat()
    }

# ========== КАТЕГОРІЇ ==========

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання всіх категорій"""

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
    """Створення нової категорії"""

    # Перевірка унікальності
    existing = await db.execute(
        select(Category).where(Category.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Категорія з таким slug вже існує"
        )

    # Створюємо категорію
    category = Category(slug=slug)
    db.add(category)
    await db.flush()

    # Додаємо переклад українською
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
    """Оновлення категорії"""

    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    if slug:
        category.slug = slug

    # Оновлюємо переклад
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
    """Видалення категорії"""

    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    await db.delete(category)
    await db.commit()

    return {"success": True, "message": "Категорію видалено"}

# ========== ПРОМОКОДИ ==========

@router.get("/promo-codes", response_model=List[PromoCodeResponse])
async def get_promo_codes(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання списку промокодів"""

    result = await db.execute(
        select(PromoCode).order_by(PromoCode.created_at.desc())
    )
    promo_codes = result.scalars().all()

    return [
        PromoCodeResponse.model_validate(promo)
        for promo in promo_codes
    ]

@router.post("/promo-codes", response_model=PromoCodeResponse)
async def create_promo_code(
    data: PromoCodeCreate,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Створення нового промокоду"""

    # Перевірка унікальності
    existing = await db.execute(
        select(PromoCode).where(PromoCode.code == data.code.upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Промокод з таким кодом вже існує"
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

@router.patch("/promo-codes/{promo_id}/toggle")
async def toggle_promo_code(
    promo_id: int,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Активація/деактивація промокоду"""

    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не знайдено")

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
    """Видалення промокоду"""

    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не знайдено")

    await db.delete(promo)
    await db.commit()

    return {"success": True, "message": "Промокод видалено"}

# ========== ЗАМОВЛЕННЯ ==========

@router.get("/orders", response_model=OrderListResponse)
async def get_orders(
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Отримання списку замовлень"""

    query = select(Order).options(
        selectinload(Order.user),
        selectinload(Order.items)
    )

    if status:
        query = query.where(Order.status == status)

    # Підрахунок
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Отримання з пагінацією
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    orders = result.scalars().unique().all()

    # Формуємо відповідь
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

@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str = Form(...),
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Зміна статусу замовлення"""

    order = await db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Замовлення не знайдено")

    valid_statuses = ["pending", "paid", "failed"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Невірний статус. Дозволено: {', '.join(valid_statuses)}"
        )

    order.status = status

    if status == "paid":
        order.paid_at = datetime.utcnow()

    await db.commit()

    return {
        "success": True,
        "order_id": order_id,
        "new_status": status
    }

# ========== ЕКСПОРТ ДАНИХ (ДОДАТКОВИЙ ФУНКЦІОНАЛ) ==========

@router.get("/export/users")
async def export_users_csv(
    admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db)
):
    """Експорт користувачів в CSV"""
    import csv
    import io
    from fastapi.responses import StreamingResponse

    # Отримуємо всіх користувачів
    result = await db.execute(
        select(User).order_by(User.created_at.desc())
    )
    users = result.scalars().all()

    # Створюємо CSV в пам'яті
    output = io.StringIO()
    writer = csv.writer(output)

    # Заголовки
    writer.writerow([
        'ID', 'Telegram ID', 'Username', 'First Name', 'Last Name',
        'Email', 'Is Admin', 'Bonus Balance', 'Created At'
    ])

    # Дані
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

    # Повертаємо як файл
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8-sig')),
        media_type='text/csv',
        headers={
            "Content-Disposition": f"attachment; filename=users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )