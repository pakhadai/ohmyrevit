from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, String, and_, or_, desc, update
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import aiofiles
from pathlib import Path
import logging
import os
import shutil
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.users.dependencies import get_current_admin_user
from app.users.models import User
from app.products.models import Product, Category, CategoryTranslation, ProductType
from app.orders.models import Order, OrderItem, PromoCode
from app.subscriptions.models import Subscription, SubscriptionStatus, UserProductAccess, AccessType
from app.wallet.models import CoinPack, Transaction, TransactionType
from app.wallet.utils import coin_pack_to_response
from app.wallet.service import WalletAdminService
from app.admin.schemas import (
    DashboardStats, UserListResponse, CategoryResponse,
    PromoCodeCreate, PromoCodeResponse, OrderListResponse,
    FileUploadResponse, UserDetailResponse, SubscriptionForUser,
    OrderForUser, ReferralForUser, OrderDetailResponse, ProductInOrder, UserBrief,
    PromoCodeDetailResponse, PromoCodeUpdate, OrderForPromoCode,
    CoinPackCreate, CoinPackUpdate, CoinPackResponse, CoinPackListResponse,
    AdminAddCoinsRequest, AdminAddCoinsResponse, TransactionForUser,
    TriggerSchedulerResponse
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
    "image/webp": ".webp",
    "image/gif": ".gif"
}


# ============ Helper Functions ============

async def save_upload_file(file: UploadFile, file_path: Path, old_path: Optional[str] = None) -> tuple:
    """Зберігає файл та повертає відносний шлях і розмір"""
    content = await file.read()
    file_size_mb = round(len(content) / (1024 * 1024), 2)

    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)

    if old_path and old_path.startswith("/uploads/"):
        old_file_path = UPLOAD_DIR / old_path.replace("/uploads/", "")
        if old_file_path.exists() and old_file_path != file_path:
            old_file_path.unlink()

    relative_path = str(file_path.relative_to(UPLOAD_DIR))
    return relative_path, file_size_mb

# ============ Dashboard ============

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
            Subscription.status == SubscriptionStatus.ACTIVE,
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

    # NEW: Статистика по монетах
    total_coins_balance = await db.scalar(
        select(func.sum(User.balance))
    ) or 0

    total_deposits = await db.scalar(
        select(func.sum(Transaction.amount)).where(
            Transaction.type == TransactionType.DEPOSIT
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
            "conversion": round(paid_orders / total_orders * 100, 1) if total_orders > 0 else 0
        },
        revenue={
            "total": float(total_revenue),
            "monthly": float(monthly_revenue)
        },
        coins={
            "total_in_circulation": total_coins_balance,
            "total_deposited": total_deposits
        }
    )


# ============ Users ============

@router.get("/users", response_model=UserListResponse)
async def get_users(
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = select(User)

    if search:
        search_filter = or_(
            User.username.ilike(f"%{search}%"),
            User.first_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.telegram_id.cast(String).ilike(f"%{search}%")
        )
        query = query.where(search_filter)

    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    query = query.offset(skip).limit(limit).order_by(User.created_at.desc())
    result = await db.execute(query)
    users = result.scalars().all()

    return UserListResponse(
        users=[UserBrief.model_validate(u) for u in users],
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/users/{user_id}", response_model=UserDetailResponse)
async def get_user_details(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    query = (
        select(User)
        .options(
            selectinload(User.subscriptions),
            selectinload(User.referrals)
        )
        .where(User.id == user_id)
    )
    result = await db.execute(query)
    user = result.unique().scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Отримуємо замовлення
    orders_query = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
        .limit(10)
    )
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()

    # Отримуємо останні транзакції
    transactions_query = (
        select(Transaction)
        .where(Transaction.user_id == user_id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    transactions_result = await db.execute(transactions_query)
    transactions = transactions_result.scalars().all()

    return UserDetailResponse(
        id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        is_admin=user.is_admin,
        is_active=user.is_active,
        balance=user.balance,
        bonus_streak=user.bonus_streak,
        language_code=user.language_code,
        last_login_at=user.last_login_at,
        last_bonus_claim_date=user.last_bonus_claim_date,
        created_at=user.created_at,
        photo_url=user.photo_url,
        subscriptions=[
            SubscriptionForUser(
                id=s.id,
                start_date=s.start_date,
                end_date=s.end_date,
                status=s.status.value if hasattr(s.status, 'value') else s.status,
                is_auto_renewal=s.is_auto_renewal
            ) for s in user.subscriptions
        ],
        orders=[
            OrderForUser(
                id=o.id,
                final_total=float(o.final_total),
                status=o.status.value if hasattr(o.status, 'value') else o.status,
                created_at=o.created_at,
                items_count=len(o.items)
            ) for o in orders
        ],
        referrals=[
            ReferralForUser(
                id=r.id,
                first_name=r.first_name,
                last_name=r.last_name,
                username=r.username,
                created_at=r.created_at
            ) for r in user.referrals
        ],
        recent_transactions=[
            TransactionForUser(
                id=t.id,
                type=t.type.value if hasattr(t.type, 'value') else t.type,
                amount=t.amount,
                balance_after=t.balance_after,
                description=t.description,
                created_at=t.created_at
            ) for t in transactions
        ]
    )


@router.post("/users/{user_id}/add-coins", response_model=AdminAddCoinsResponse)
async def admin_add_coins(
        user_id: int,
        data: AdminAddCoinsRequest,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Ручне нарахування монет користувачу"""
    service = WalletAdminService(db)

    try:
        transaction = await service.manual_add_coins(
            user_id=user_id,
            amount=data.amount,
            reason=data.reason,
            admin_id=admin.id
        )

        # Сповіщаємо користувача
        user = await db.get(User, user_id)
        if user and user.telegram_id:
            try:
                await telegram_service.send_message(
                    user.telegram_id,
                    f"🎁 Вам нараховано {data.amount} OMR Coins!\n\n"
                    f"💬 Причина: {data.reason}\n"
                    f"💵 Новий баланс: {transaction.balance_after} монет"
                )
            except Exception as e:
                logger.error(f"Failed to notify user: {e}")

        return AdminAddCoinsResponse(
            success=True,
            user_id=user_id,
            coins_added=data.amount,
            new_balance=transaction.balance_after,
            transaction_id=transaction.id
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/users/{user_id}/toggle-admin")
async def toggle_user_admin(
        user_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot change own admin status")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = not user.is_admin
    await db.commit()

    return {"success": True, "user_id": user_id, "is_admin": user.is_admin}


# ============ CoinPacks (NEW) ============

@router.get("/coin-packs", response_model=CoinPackListResponse)
async def get_all_coin_packs(
        include_inactive: bool = False,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Отримати всі пакети монет"""
    query = select(CoinPack).order_by(CoinPack.sort_order)

    if not include_inactive:
        query = query.where(CoinPack.is_active == True)

    result = await db.execute(query)
    packs = list(result.scalars().all())

    return CoinPackListResponse(
        packs=[coin_pack_to_response(p) for p in packs],
        total=len(packs)
    )


@router.get("/coin-packs/{pack_id}", response_model=CoinPackResponse)
async def get_coin_pack(
        pack_id: int,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Отримати пакет монет за ID"""
    pack = await db.get(CoinPack, pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail="CoinPack not found")

    return coin_pack_to_response(pack)


@router.post("/coin-packs", response_model=CoinPackResponse)
async def create_coin_pack(
        data: CoinPackCreate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Створити новий пакет монет"""
    # Перевіряємо унікальність permalink
    existing = await db.execute(
        select(CoinPack).where(CoinPack.gumroad_permalink == data.gumroad_permalink)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="CoinPack with this permalink already exists"
        )

    pack = CoinPack(**data.model_dump())
    db.add(pack)
    await db.commit()
    await db.refresh(pack)

    return coin_pack_to_response(pack)


@router.put("/coin-packs/{pack_id}", response_model=CoinPackResponse)
async def update_coin_pack(
        pack_id: int,
        data: CoinPackUpdate,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Оновити пакет монет"""
    pack = await db.get(CoinPack, pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail="CoinPack not found")

    update_data = data.model_dump(exclude_unset=True)

    # Перевіряємо унікальність permalink якщо змінюється
    if 'gumroad_permalink' in update_data:
        existing = await db.execute(
            select(CoinPack).where(
                CoinPack.gumroad_permalink == update_data['gumroad_permalink'],
                CoinPack.id != pack_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="CoinPack with this permalink already exists"
            )

    for key, value in update_data.items():
        setattr(pack, key, value)

    await db.commit()
    await db.refresh(pack)

    return coin_pack_to_response(pack)


@router.delete("/coin-packs/{pack_id}")
async def delete_coin_pack(
        pack_id: int,
        hard_delete: bool = False,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Видалити/деактивувати пакет монет"""
    pack = await db.get(CoinPack, pack_id)
    if not pack:
        raise HTTPException(status_code=404, detail="CoinPack not found")

    if hard_delete:
        await db.delete(pack)
        message = "CoinPack permanently deleted"
    else:
        pack.is_active = False
        message = "CoinPack deactivated"

    await db.commit()

    return {"success": True, "message": message}


# ============ Categories ============

@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).options(selectinload(Category.translations))
    )
    categories = result.scalars().all()

    response = []
    for cat in categories:
        uk_translation = next(
            (t for t in cat.translations if t.language_code == 'uk'),
            None
        )
        response.append(CategoryResponse(
            id=cat.id,
            slug=cat.slug,
            name=uk_translation.name if uk_translation else cat.slug
        ))

    return response


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
        slug: str = Body(...),
        name: str = Body(...),
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(select(Category).where(Category.slug == slug))
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

    return CategoryResponse(id=category.id, slug=category.slug, name=name)


@router.put("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
        category_id: int,
        slug: Optional[str] = Body(None),
        name: Optional[str] = Body(None),
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


# ============ Promo Codes ============

@router.get("/promo-codes", response_model=List[PromoCodeResponse])
async def get_promo_codes(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PromoCode).order_by(PromoCode.created_at.desc())
    )
    promo_codes = result.scalars().all()

    return [PromoCodeResponse.model_validate(promo) for promo in promo_codes]


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

    return {"success": True, "promo_id": promo_id, "is_active": promo.is_active}


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


# ============ Orders ============

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

    return OrderDetailResponse(
        id=order.id,
        user=UserBrief.model_validate(order.user),
        subtotal=float(order.subtotal),
        discount_amount=float(order.discount_amount),
        coins_spent=int(order.final_total * 100) if order.final_total else 0,
        final_total=float(order.final_total),
        status=order.status.value if hasattr(order.status, 'value') else order.status,
        promo_code=PromoCodeResponse.model_validate(order.promo_code) if order.promo_code else None,
        created_at=order.created_at,
        paid_at=getattr(order, 'paid_at', None),
        items=items_data
    )


# ============ Subscription Management (Manual) ============

class AdminSubscriptionRequest(BaseModel):
    days: int


@router.post("/users/{user_id}/subscription")
async def admin_give_subscription(
        user_id: int,
        data: AdminSubscriptionRequest,
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """
    Ручна видача підписки адміністратором.
    Надає доступ до всіх Premium товарів.
    """
    # 1. Деактивуємо старі активні підписки, щоб не було конфліктів
    await db.execute(
        update(Subscription)
        .where(
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.ACTIVE
        )
        .values(status=SubscriptionStatus.EXPIRED)
    )

    # 2. Розраховуємо дати
    start_date = datetime.now(timezone.utc)
    end_date = start_date + timedelta(days=data.days)

    # 3. Створюємо нову підписку
    subscription = Subscription(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        status=SubscriptionStatus.ACTIVE,
        is_auto_renewal=False  # Адмінська підписка зазвичай не продовжується сама
    )
    db.add(subscription)
    await db.flush()  # Щоб отримати ID підписки, якщо потрібно

    # 4. Надаємо доступ до всіх Premium товарів
    # Отримуємо ID всіх преміум товарів
    premium_products_query = select(Product.id).where(Product.product_type == ProductType.PREMIUM)
    premium_products_res = await db.execute(premium_products_query)
    premium_ids = premium_products_res.scalars().all()

    # Перевіряємо, які доступи вже є, щоб не дублювати
    existing_access_query = select(UserProductAccess.product_id).where(
        UserProductAccess.user_id == user_id,
        UserProductAccess.product_id.in_(premium_ids)
    )
    existing_access_res = await db.execute(existing_access_query)
    existing_ids = set(existing_access_res.scalars().all())

    # Додаємо нові записи доступу
    new_access_records = []
    for pid in premium_ids:
        if pid not in existing_ids:
            new_access_records.append(
                UserProductAccess(
                    user_id=user_id,
                    product_id=pid,
                    access_type=AccessType.SUBSCRIPTION
                )
            )

    if new_access_records:
        db.add_all(new_access_records)

    await db.commit()

    # Логуємо дію
    logger.info(f"Admin {admin.id} granted subscription ({data.days} days) to user {user_id}")

    return {"success": True, "message": f"Subscription granted for {data.days} days"}

# ============ Scheduler Trigger ============

@router.post("/trigger-scheduler", response_model=TriggerSchedulerResponse)
async def trigger_subscription_scheduler(
        admin: User = Depends(get_current_admin_user),
        db: AsyncSession = Depends(get_db)
):
    """Ручний запуск scheduler для тестування"""
    from app.core.scheduler import trigger_subscription_check

    result = await trigger_subscription_check()
    return TriggerSchedulerResponse(**result)


# ============ File Uploads ============

@router.post("/upload/image", response_model=FileUploadResponse)
async def upload_image(
        file: UploadFile = File(...),
        old_path: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_invalid_type", "uk", allowed=", ".join(ALLOWED_IMAGE_TYPES.keys()))
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = file.filename.replace(" ", "_")
    if not filename.lower().endswith(extension):
        name, _ = os.path.splitext(filename)
        filename = f"{name}{extension}"

    file_path = UPLOAD_DIR / "images" / filename

    if file_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"
        file_path = UPLOAD_DIR / "images" / filename

    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    return FileUploadResponse(
        file_path=f"/uploads/{relative_path}",
        file_size_mb=file_size_mb,
        filename=filename
    )


@router.post("/upload/archive", response_model=FileUploadResponse)
async def upload_archive(
        file: UploadFile = File(...),
        old_path: Optional[str] = Form(None),
        admin: User = Depends(get_current_admin_user)
):
    _, extension = os.path.splitext(file.filename)
    if extension.lower() not in [".zip", ".rar", ".7z"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=get_text("admin_upload_error_type_archive", "uk", allowed=".zip, .rar, .7z")
        )

    filename = file.filename.replace(" ", "_")
    file_path = UPLOAD_DIR / "archives" / filename

    if file_path.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        name, ext = os.path.splitext(filename)
        filename = f"{name}_{timestamp}{ext}"
        file_path = UPLOAD_DIR / "archives" / filename

    relative_path, file_size_mb = await save_upload_file(file, file_path, old_path)

    return FileUploadResponse(
        file_path=f"/uploads/{relative_path}",
        file_size_mb=file_size_mb,
        filename=filename
    )