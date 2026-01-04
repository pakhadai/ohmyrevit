from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.users.dependencies import get_current_user
from app.users.models import User
from app.ratings.schemas import (
    RatingCreate,
    RatingResponse,
    ProductRatingStats
)
from app.ratings.service import RatingService

router = APIRouter(tags=["ratings"])


@router.post(
    "",
    response_model=RatingResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_or_update_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Створити або оновити рейтинг товару.
    Користувач може ставити оцінку тільки товарам, до яких має доступ.
    """
    service = RatingService(db)

    try:
        rating = await service.create_or_update_rating(
            user_id=current_user.id,
            product_id=rating_data.product_id,
            rating=rating_data.rating
        )
        return rating
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/product/{product_id}", response_model=ProductRatingStats)
async def get_product_rating_stats(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Отримати статистику рейтингів товару.
    Включає середній рейтинг, кількість оцінок та рейтинг поточного користувача (якщо є).
    """
    service = RatingService(db)

    try:
        stats = await service.get_product_rating_stats(product_id, current_user.id)
        return stats
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/product/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rating(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Видалити рейтинг товару"""
    service = RatingService(db)

    deleted = await service.delete_rating(current_user.id, product_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Рейтинг не знайдено"
        )

    return None
