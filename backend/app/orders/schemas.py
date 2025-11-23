from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from decimal import Decimal
from datetime import datetime


class CreateOrderRequest(BaseModel):
    product_ids: List[int]
    promo_code: Optional[str] = None
    use_bonus_points: Optional[int] = Field(None, ge=0)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "product_ids": [1, 2, 3],
                "promo_code": "WINTER2025",
                "use_bonus_points": 500
            }
        }
    )

class ApplyDiscountRequest(BaseModel):
    product_ids: List[int]
    promo_code: Optional[str] = None
    use_bonus_points: Optional[int] = Field(None, ge=0)

class ApplyDiscountResponse(BaseModel):
    success: bool
    # ЗМІНЕНО: float -> Decimal
    discount_amount: Decimal = Decimal("0.00")
    final_total: Decimal
    message: Optional[str] = None
    bonus_points_used: int = 0


class OrderResponse(BaseModel):
    id: int
    user_id: int
    subtotal: Decimal
    discount_amount: Decimal
    final_total: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    price_at_purchase: Decimal

    model_config = ConfigDict(from_attributes=True)


class CheckoutResponse(BaseModel):
    order_id: int
    payment_url: Optional[str] = None
    # ЗМІНЕНО: float -> Decimal
    amount: Decimal