"""
Pydantic схеми для валідації даних товарів
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum


class ProductTypeEnum(str, Enum):
    """Типи товарів"""
    FREE = "free"
    PREMIUM = "premium"


class SortByEnum(str, Enum):
    """Варіанти сортування"""
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NEWEST = "newest"
    POPULAR = "popular"


# ========== Схеми для категорій ==========

class CategoryBase(BaseModel):
    """Базова схема категорії"""
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)


class CategoryCreate(CategoryBase):
    """Схема для створення категорії"""
    pass


class CategoryResponse(CategoryBase):
    """Схема відповіді категорії"""
    id: int

    model_config = ConfigDict(from_attributes=True)


# ========== Схеми для товарів ==========

class ProductBase(BaseModel):
    """Базові поля товару"""
    price: Decimal = Field(..., ge=0, decimal_places=2)
    product_type: ProductTypeEnum = ProductTypeEnum.PREMIUM
    main_image_url: str = Field(..., max_length=500)
    gallery_image_urls: Optional[List[str]] = []
    zip_file_path: str = Field(..., max_length=500)
    file_size_mb: Decimal = Field(..., ge=0, decimal_places=2)
    compatibility: Optional[str] = Field(None, max_length=200)
    is_on_sale: bool = False
    sale_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)


class ProductCreate(ProductBase):
    """Схема для створення товару (адмін)"""
    title_uk: str = Field(..., min_length=1, max_length=200, description="Назва українською")
    description_uk: str = Field(..., min_length=1, description="Опис українською")
    category_ids: Optional[List[int]] = []

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title_uk": "Сучасний офісний стіл",
                "description_uk": "Детальний опис столу з усіма параметрами...",
                "price": 49.99,
                "product_type": "premium",
                "main_image_url": "https://example.com/image.jpg",
                "gallery_image_urls": ["https://example.com/img1.jpg"],
                "zip_file_path": "/files/table_model.zip",
                "file_size_mb": 125.5,
                "compatibility": "Revit 2021-2024",
                "is_on_sale": False,
                "category_ids": [1, 2]
            }
        }
    )


class ProductUpdate(BaseModel):
    """Схема для оновлення товару"""
    title_uk: Optional[str] = Field(None, min_length=1, max_length=200)
    description_uk: Optional[str] = Field(None, min_length=1)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    product_type: Optional[ProductTypeEnum] = None
    main_image_url: Optional[str] = Field(None, max_length=500)
    gallery_image_urls: Optional[List[str]] = None
    zip_file_path: Optional[str] = Field(None, max_length=500)
    file_size_mb: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    compatibility: Optional[str] = Field(None, max_length=200)
    is_on_sale: Optional[bool] = None
    sale_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    category_ids: Optional[List[int]] = None


class ProductFilter(BaseModel):
    """Фільтри для пошуку товарів"""
    category_id: Optional[int] = None
    product_type: Optional[ProductTypeEnum] = None
    is_on_sale: Optional[bool] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    sort_by: Optional[SortByEnum] = SortByEnum.NEWEST


class ProductTranslationResponse(BaseModel):
    """Схема перекладу товару"""
    language_code: str
    title: str
    description: str
    is_auto_translated: bool

    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    """Повна відповідь товару для API"""
    id: int
    title: str
    description: str
    price: float
    product_type: str
    main_image_url: str
    gallery_image_urls: List[str]
    file_size_mb: float
    compatibility: Optional[str]
    is_on_sale: bool
    sale_price: Optional[float]
    actual_price: float
    categories: List[CategoryResponse]
    views_count: int
    downloads_count: int
    created_at: Optional[datetime]


class ProductListResponse(BaseModel):
    """Відповідь списку товарів"""
    id: int
    title: str
    description: str  # Скорочений опис
    price: float
    product_type: str
    main_image_url: str
    is_on_sale: bool
    sale_price: Optional[float]
    actual_price: float
    categories: List[str]  # Тільки назви
    views_count: int


class PaginatedProductsResponse(BaseModel):
    """Відповідь з пагінацією"""
    products: List[ProductListResponse]
    total: int
    limit: int
    offset: int
    pages: int


# ========== Схеми для адміністрування ==========

class ProductAdminResponse(ProductResponse):
    """Розширена відповідь для адміна"""
    translations: List[ProductTranslationResponse]
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)