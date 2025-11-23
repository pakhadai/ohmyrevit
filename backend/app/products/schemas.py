# backend/app/products/schemas.py
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum


class ProductTypeEnum(str, Enum):
    FREE = "free"
    PREMIUM = "premium"


class SortByEnum(str, Enum):
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NEWEST = "newest"
    POPULAR = "popular"


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    # ЗМІНЕНО: Decimal
    price: Decimal = Field(..., ge=0)
    product_type: ProductTypeEnum = ProductTypeEnum.PREMIUM
    main_image_url: str = Field(..., max_length=500)
    gallery_image_urls: Optional[List[str]] = []
    zip_file_path: str = Field(..., max_length=500)
    file_size_mb: Decimal = Field(..., ge=0)
    compatibility: Optional[str] = Field(None, max_length=200)
    is_on_sale: bool = False
    # ЗМІНЕНО: Decimal
    sale_price: Optional[Decimal] = Field(None, ge=0)


class ProductCreate(ProductBase):
    title_uk: str = Field(..., min_length=1, max_length=200)
    description_uk: str = Field(..., min_length=1)
    category_ids: Optional[List[int]] = []

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title_uk": "Сучасний офісний стіл",
                "description_uk": "Детальний опис...",
                "price": "49.99",
                "product_type": "premium",
                "main_image_url": "/uploads/image.jpg",
                "zip_file_path": "/uploads/file.zip",
                "file_size_mb": 12.5,
                "compatibility": "Revit 2024",
                "category_ids": [1]
            }
        }
    )


class ProductUpdate(BaseModel):
    title_uk: Optional[str] = None
    description_uk: Optional[str] = None
    price: Optional[Decimal] = None
    product_type: Optional[ProductTypeEnum] = None
    main_image_url: Optional[str] = None
    gallery_image_urls: Optional[List[str]] = None
    zip_file_path: Optional[str] = None
    file_size_mb: Optional[Decimal] = None
    compatibility: Optional[str] = None
    is_on_sale: Optional[bool] = None
    sale_price: Optional[Decimal] = None
    category_ids: Optional[List[int]] = None


class ProductFilter(BaseModel):
    category_id: Optional[int] = None
    product_type: Optional[ProductTypeEnum] = None
    is_on_sale: Optional[bool] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    sort_by: Optional[SortByEnum] = SortByEnum.NEWEST


class ProductTranslationResponse(BaseModel):
    language_code: str
    title: str
    description: str
    is_auto_translated: bool
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    title: str
    description: str
    price: Decimal # Decimal
    product_type: str
    main_image_url: str
    gallery_image_urls: List[str]
    zip_file_path: str
    file_size_mb: float
    compatibility: Optional[str]
    is_on_sale: bool
    sale_price: Optional[Decimal] # Decimal
    actual_price: Decimal # Decimal
    categories: List[CategoryResponse]
    views_count: int
    downloads_count: int
    created_at: Optional[datetime]


class ProductListResponse(BaseModel):
    id: int
    title: str
    description: str
    price: Decimal # Decimal
    product_type: str
    main_image_url: str
    is_on_sale: bool
    sale_price: Optional[Decimal] # Decimal
    actual_price: Decimal # Decimal
    categories: List[str]
    views_count: int
    file_size_mb: float


class PaginatedProductsResponse(BaseModel):
    products: List[ProductListResponse]
    total: int
    limit: int
    offset: int
    pages: int


class ProductAdminResponse(ProductResponse):
    translations: List[ProductTranslationResponse]
    updated_at: Optional[datetime]
    model_config = ConfigDict(from_attributes=True)