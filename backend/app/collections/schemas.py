from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from app.products.schemas import ProductListResponse

class CollectionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field("default", max_length=20)

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, max_length=20)

class CollectionResponse(CollectionBase):
    id: int
    created_at: datetime
    products_count: int

    model_config = ConfigDict(from_attributes=True)

class ProductInCollectionResponse(BaseModel):
    id: int
    title: str
    description: str
    main_image_url: str
    price: float
    product_type: str

class CollectionDetailResponse(CollectionResponse):
    products: List[ProductInCollectionResponse]