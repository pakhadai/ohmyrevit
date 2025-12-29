from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.products.schemas import ProductListResponse

class CollectionBase(BaseModel):
    """Базова схема для Wishlist (списку бажань)"""
    name: str = Field(..., min_length=1, max_length=100, description="Назва списку бажань")
    color: str = Field("default", max_length=20, description="Колір списку для візуалізації")

class CollectionCreate(CollectionBase):
    """Створення нового списку бажань"""
    pass

class CollectionUpdate(BaseModel):
    """Оновлення існуючого списку бажань"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)

class CollectionResponse(CollectionBase):
    """Відповідь зі списком бажань"""
    id: int
    created_at: datetime
    products_count: int

    model_config = ConfigDict(from_attributes=True)

class ProductInCollectionResponse(BaseModel):
    """Товар у списку бажань"""
    id: int
    title: str
    description: str
    main_image_url: str
    price: float
    product_type: str

class CollectionDetailResponse(CollectionResponse):
    """Детальна інформація про список бажань з товарами"""
    products: List[ProductInCollectionResponse]