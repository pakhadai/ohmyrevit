from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class RatingCreate(BaseModel):
    """Схема для створення рейтингу"""
    product_id: int
    rating: int = Field(..., ge=1, le=5, description="Рейтинг від 1 до 5")


class RatingUpdate(BaseModel):
    """Схема для оновлення рейтингу"""
    rating: int = Field(..., ge=1, le=5, description="Рейтинг від 1 до 5")


class RatingResponse(BaseModel):
    """Схема для відповіді з рейтингом"""
    id: int
    user_id: int
    product_id: int
    rating: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductRatingStats(BaseModel):
    """Статистика рейтингів товару"""
    average_rating: Optional[float] = None
    ratings_count: int = 0
    user_rating: Optional[int] = None  # Рейтинг поточного користувача
