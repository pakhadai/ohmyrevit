"""
Головний роутер адмін-панелі
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.users.dependencies import get_current_admin_user
from app.users.models import User
from app.products.models import Product, Category
from app.orders.models import Order, PromoCode
from app.subscriptions.models import Subscription

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


# ========== DASHBOARD ==========

@router.get("/dashboard/stats")
async def get_dashboard_stats(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання статистики для дашборду адміна
    """
    # Загальна кількість користувачів
    users_count = await db.scalar(
        select(func.count(User.id))
    )

    # Кількість нових користувачів за останні 7 днів
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = await db.scalar(
        select(func.count(User.id)).where(User.created_at >= week_ago)
    )

    # Загальна кількість товарів
    products_count = await db.scalar(
        select(func.count(Product.id))
    )

    # Кількість активних підписок
    active_subscriptions = await db.scalar(
        select(func.count(Subscription.id)).where(
            Subscription.status == "active",
            Subscription.end_date > datetime.utcnow()
        )
    )

    # Статистика замовлень
    total_orders = await db.scalar(
        select(func.count(Order.id))
    )

    paid_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == "paid")
    )

    # Загальний дохід
    total_revenue = await db.scalar(
        select(func.sum(Order.final_total)).where(Order.status == "paid")
    ) or 0

    # Дохід за останні 30 днів
    month_ago = datetime.utcnow() - timedelta(days=30)
    monthly_revenue = await db.scalar(
        select(func.sum(Order.final_total)).where(
            Order.status == "paid",
            Order.created_at >= month_ago
        )
    ) or 0

    return {
        "users": {
            "total": users_count,
            "new_this_week": new_users
        },
        "products": {
            "total": products_count
        },
        "subscriptions": {
            "active": active_subscriptions
        },
        "orders": {
            "total": total_orders,
            "paid": paid_orders,
            "conversion_rate": round((paid_orders / total_orders * 100) if total_orders > 0 else 0, 2)
        },
        "revenue": {
            "total": float(total_revenue),
            "monthly": float(monthly_revenue)
        }
    }


# ========== КОРИСТУВАЧІ ==========

@router.get("/users")
async def get_users(
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку користувачів з пошуком
    """
    query = select(User)

    if search:
        search_term = f"%{search}%"
        query = query.where(
            User.username.ilike(search_term) |
            User.first_name.ilike(search_term) |
            User.telegram_id.cast(String).ilike(search_term)
        )

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    # Рахуємо загальну кількість
    count_query = select(func.count(User.id))
    if search:
        count_query = count_query.where(
            User.username.ilike(search_term) |
            User.first_name.ilike(search_term)
        )
    total = await db.scalar(count_query)

    return {
        "users": users,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.patch("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Зміна статусу адміністратора користувача
    """
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
    """
    Блокування/розблокування користувача
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=400,
            detail="Не можна заблокувати самого себе"
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

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
        amount: int,
        reason: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Нарахування бонусів користувачу вручну
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    user.bonus_balance += amount
    await db.commit()

    # TODO: Можна додати логування цієї операції

    return {
        "success": True,
        "user_id": user_id,
        "new_balance": user.bonus_balance,
        "added": amount,
        "reason": reason
    }


# ========== КАТЕГОРІЇ ==========

@router.get("/categories")
async def get_categories(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання всіх категорій
    """
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return categories


@router.post("/categories")
async def create_category(
        name: str,
        slug: str,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Створення нової категорії
    """
    # Перевірка унікальності
    existing = await db.execute(
        select(Category).where(
            (Category.name == name) | (Category.slug == slug)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Категорія з таким ім'ям або slug вже існує"
        )

    category = Category(name=name, slug=slug)
    db.add(category)
    await db.commit()
    await db.refresh(category)

    return category


@router.put("/categories/{category_id}")
async def update_category(
        category_id: int,
        name: Optional[str] = None,
        slug: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Оновлення категорії
    """
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    if name:
        category.name = name
    if slug:
        category.slug = slug

    await db.commit()
    await db.refresh(category)

    return category


@router.delete("/categories/{category_id}")
async def delete_category(
        category_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Видалення категорії
    """
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Категорію не знайдено")

    await db.delete(category)
    await db.commit()

    return {"success": True, "message": "Категорію видалено"}


# ========== ПРОМОКОДИ ==========

@router.get("/promo-codes")
async def get_promo_codes(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку промокодів
    """
    result = await db.execute(
        select(PromoCode).order_by(PromoCode.created_at.desc())
    )
    promo_codes = result.scalars().all()
    return promo_codes


@router.post("/promo-codes")
async def create_promo_code(
        code: str,
        discount_type: str,  # "percentage" або "fixed"
        value: float,
        max_uses: Optional[int] = None,
        expires_at: Optional[datetime] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Створення нового промокоду
    """
    # Перевірка унікальності
    existing = await db.execute(
        select(PromoCode).where(PromoCode.code == code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Промокод з таким кодом вже існує"
        )

    promo = PromoCode(
        code=code.upper(),
        discount_type=discount_type,
        value=value,
        max_uses=max_uses,
        expires_at=expires_at,
        is_active=True
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)

    return promo


@router.patch("/promo-codes/{promo_id}/toggle")
async def toggle_promo_code(
        promo_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Активація/деактивація промокоду
    """
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
    """
    Видалення промокоду
    """
    promo = await db.get(PromoCode, promo_id)
    if not promo:
        raise HTTPException(status_code=404, detail="Промокод не знайдено")

    await db.delete(promo)
    await db.commit()

    return {"success": True, "message": "Промокод видалено"}


# ========== ЗАМОВЛЕННЯ ==========

@router.get("/orders")
async def get_orders(
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Отримання списку замовлень
    """
    from sqlalchemy.orm import selectinload

    query = select(Order).options(
        selectinload(Order.user),
        selectinload(Order.items)
    )

    if status:
        query = query.where(Order.status == status)

    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())

    result = await db.execute(query)
    orders = result.scalars().all()

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

    return {
        "orders": orders_data,
        "total": await db.scalar(select(func.count(Order.id))),
        "skip": skip,
        "limit": limit
    }


# Додаємо імпорт для String
from sqlalchemy import String